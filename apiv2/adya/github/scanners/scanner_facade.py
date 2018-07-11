
from adya.common.db.models import DataSource, DatasourceScanners, alchemy_encoder, ApplicationUserAssociation, DomainUser, Application, AppInventory, AppLicenseInventory 
from adya.common.db.connection import db_connection
from adya.github import github_constants
from adya.github.scanners import members_scanner, repository_scanner, organisation_scanner, account_scanner
from adya.common.utils import messaging, utils
from adya.common.constants import urls
from datetime import datetime
from sqlalchemy import and_
import json
import time

def request_scanner_data(auth_token, query_params):
    db_session = db_connection().get_session()
    datasource_id = query_params["datasource_id"]
    scanner_id = query_params["scanner_id"]

    scanner = db_session.query(DatasourceScanners).filter(DatasourceScanners.datasource_id == datasource_id, DatasourceScanners.id == scanner_id).first()
    if not scanner:
        return
    
    scanner_processor = get_scanner_processor(scanner.scanner_type)
    response = scanner_processor.query(auth_token, query_params, scanner)
    entities_list = response["payload"]
    if scanner.scanner_type == "ACCOUNT":
        fetched_repo_count = response["repo_count"]
        fetched_org_count = response["org_count"]
        fetched_entities_count = fetched_repo_count + fetched_org_count
    else:
        fetched_entities_count = len(entities_list)
    in_progress = 0 if fetched_entities_count < 1 else 1

    while (True):
        try:
            db_session.query(DatasourceScanners).filter(DatasourceScanners.datasource_id == datasource_id, DatasourceScanners.id == scanner_id). \
                update({DatasourceScanners.total_count: DatasourceScanners.total_count + fetched_entities_count,
                DatasourceScanners.query_status: DatasourceScanners.query_status + 1,
                DatasourceScanners.in_progress: in_progress })

            datasource_metric_column = get_datasource_column(scanner.scanner_type)
            if datasource_metric_column and scanner.scanner_type == "ACCOUNT":
                db_session.query(DataSource).filter(DataSource.datasource_id == datasource_id). \
                    update({ datasource_metric_column[0]: datasource_metric_column[0] + fetched_repo_count, datasource_metric_column[1]: datasource_metric_column[1] + fetched_org_count })
            elif datasource_metric_column:
                db_session.query(DataSource).filter(DataSource.datasource_id == datasource_id). \
                    update({ datasource_metric_column: datasource_metric_column + fetched_entities_count })

            db_connection().commit()
            break
        except Exception as ex:
            print ex
            db_session.rollback()
    
    scanner_data = {}
    scanner_data["entities"] = entities_list
    try:
        scanner_data["permissions"] = response["permissions"] if response["permissions"] else None
    except Exception as ex:
        print ex
    messaging.trigger_post_event(urls.GITHUB_SCAN_ENTITIES, auth_token, query_params, scanner_data, "github")

def process_scanner_data(auth_token, query_params, scanner_data):
    #Process the scanner data here 
    db_session = db_connection().get_session()
    datasource_id = query_params["datasource_id"]
    scanner_id = query_params["scanner_id"]

    scanner = db_session.query(DatasourceScanners).filter(DatasourceScanners.datasource_id == datasource_id, DatasourceScanners.id == scanner_id).first()

    if not scanner:
        return
    
    scanner_processor = get_scanner_processor(scanner.scanner_type)
    processed_results = scanner_processor.process(db_session, auth_token, query_params, scanner_data)

    if scanner.scanner_type == "ACCOUNT":
        processed_repos = processed_results["repo_count"]
        processed_orgs = processed_results["org_count"]
        processed_results = processed_repos + processed_orgs

    while(True):
        try:
            db_session.query(DatasourceScanners).filter(DatasourceScanners.datasource_id == datasource_id, DatasourceScanners.id == scanner_id). \
                update({ DatasourceScanners.process_status: DatasourceScanners.process_status + 1 })
            
            if processed_results > 0:
                db_session.query(DatasourceScanners).filter(DatasourceScanners.datasource_id == datasource_id, DatasourceScanners.id == scanner_id). \
                    update({ DatasourceScanners.processed_count: DatasourceScanners.processed_count + processed_results })
            
            scanner.updated_at = datetime.utcnow()
            datasource_metric_column = get_datasource_column(scanner.scanner_type, False)
            if datasource_metric_column and scanner.scanner_type == "ACCOUNT":
                db_session.query(DataSource).filter(DataSource.datasource_id == datasource_id). \
                    update({ datasource_metric_column[0]: datasource_metric_column[0] + processed_repos, datasource_metric_column[1]: datasource_metric_column[1] + processed_orgs })
            elif datasource_metric_column:
                db_session.query(DataSource).filter(DataSource.datasource_id == datasource_id). \
                    update({ datasource_metric_column: datasource_metric_column + processed_results })
            
            db_connection().commit()
            break
        except Exception as ex:
            db_session.rollback()
    
    datasource = db_session.query(DataSource).filter(DataSource.datasource_id == datasource_id, DataSource.is_async_delete == False).first()
    messaging.send_push_notification("adya-scan-update", json.dumps(datasource, cls=alchemy_encoder()))
    scanner.in_progress = 0
    db_connection().commit()
    messaging.trigger_post_event(urls.GITHUB_SCAN_UPDATE, auth_token, query_params, {}, "github")

def update_scan(auth_token, datasource_id, domain_id):
    db_session = db_connection().get_session()
    scan_complete = db_session.query(DatasourceScanners).filter(and_(DatasourceScanners.datasource_id == datasource_id, DatasourceScanners.in_progress > 0)).count()
    print "Total scanners in progress : {0}".format(scan_complete)
    try:
        if scan_complete == 0:
            db_session.query(DataSource).filter(DataSource.datasource_id == datasource_id). \
                update({ DataSource.is_push_notifications_enabled: 1 })
            scan_complete_processing(db_session, auth_token, datasource_id)
    except Exception as ex:
        print ex

def scan_complete_processing(db_session, auth_token, datasource_id):
    try:
        db_session.query(ApplicationUserAssociation).filter(ApplicationUserAssociation.datasource_id == datasource_id,
                                                            DomainUser.datasource_id == datasource_id,
                                                            DomainUser.user_id ==
                                                            ApplicationUserAssociation.user_email). \
            update({ApplicationUserAssociation.user_email: DomainUser.email}, synchronize_session = 'fetch')
        db_connection().commit()
        datasource = db_session.query(DataSource).filter(and_(DataSource.datasource_id == datasource_id, DataSource.is_async_delete == False)).first()
        messaging.send_push_notification("adya-scan-update", json.dumps(datasource, cls=alchemy_encoder()))
        application = db_session.query(Application).filter(Application.domain_id == datasource.domain_id, Application.display_text == "GITHUB").first()
        if not application:
            utils.add_license_for_scanned_app(db_session, datasource)

    except Exception as ex:
        print ex

def get_datasource_column(scanner_type, is_total = True):
    column_name = None
    if scanner_type == github_constants.ScannerTypes.REPOSITORIES.value or scanner_type == github_constants.ScannerTypes.ORGANISATIONS.value:
        column_name = DataSource.total_user_count if is_total else DataSource.processed_user_count
    elif scanner_type == github_constants.ScannerTypes.ACCOUNT.value:
        column_name = (DataSource.total_file_count, DataSource.total_user_count) if is_total else (DataSource.processed_file_count, DataSource.processed_user_count)
    return column_name


def get_scanner_processor(scanner_type):
    scanner_processor = None
    if scanner_type == github_constants.ScannerTypes.USERS.value:
        scanner_processor = members_scanner
    elif scanner_type == github_constants.ScannerTypes.REPOSITORIES.value:
        scanner_processor = repository_scanner
    elif scanner_type == github_constants.ScannerTypes.ORGANISATIONS.value:
        scanner_processor = organisation_scanner
    elif scanner_type == github_constants.ScannerTypes.ACCOUNT.value:
        scanner_processor = account_scanner
    return scanner_processor
