
from adya.common.db.models import DataSource, DatasourceScanners, alchemy_encoder, DomainUser, ResourcePermission 
from adya.common.db.connection import db_connection
from adya.github import github_constants
from adya.github.scanners import repository_scanner, organisation_scanner, rep_collaborators_scanner, org_members_scanner
from adya.common.utils import messaging, utils
from adya.common.constants import urls
from adya.common.utils.response_messages import Logger
from datetime import datetime
from sqlalchemy import and_
import json, time, uuid

def start_scan(auth_token, datasource_id, domain_id, user_email):
    db_session = db_connection().get_session()
    scanner_types = [github_constants.ScannerTypes.ORGANISATIONS.value, github_constants.ScannerTypes.REPOSITORIES.value]
    
    for scanner_type in scanner_types:
        scanner = DatasourceScanners()
        scanner.datasource_id = datasource_id
        scanner.scanner_type = scanner_type
        scanner.channel_id = str(uuid.uuid4())
        scanner.user_email = user_email
        scanner.started_at = datetime.utcnow()
        scanner.in_progress = 1
        db_session.add(scanner)
        db_connection().commit()
        query_params = {"dataSourceId": datasource_id, "domainId": domain_id, "scannerId": scanner.id}
        messaging.trigger_get_event(urls.GITHUB_SCAN_ENTITIES, auth_token, query_params, "github")

def update_scan(auth_token, datasource_id, domain_id):
    time.sleep(2)
    db_session = db_connection().get_session()
    scan_complete = db_session.query(DatasourceScanners).filter(and_(DatasourceScanners.datasource_id == datasource_id, DatasourceScanners.in_progress > 0)).count()
    #print "Total scanners in progress - {}".format(scan_complete)
    if scan_complete == 0:
        scan_complete = db_session.query(DataSource).filter(and_(DataSource.datasource_id == datasource_id, DataSource.is_push_notifications_enabled == 0)). \
                update({DataSource.is_push_notifications_enabled: 1})
        Logger().info("update_scan: scan_complete - {}".format(scan_complete))
        #print "Scan complete status - {}".format(scan_complete)
        if scan_complete > 0:
            Logger().info("update_scan : call Scan completed processing method")
            scan_complete_processing(db_session, auth_token, datasource_id)

def request_scanner_data(auth_token, query_params):
    datasource_id = query_params["dataSourceId"]
    scanner_id = query_params["scannerId"]

    db_session = db_connection().get_session()
    scanner = db_session.query(DatasourceScanners).filter(DatasourceScanners.datasource_id == datasource_id, DatasourceScanners.id == scanner_id).first()
    if not scanner:
        return
    
    response = None
    try:
        response = get_scanner_processor(scanner.scanner_type).query(auth_token, query_params, scanner)
    except Exception as ex:
        Logger().exception("Exception occurred while querying scan data for - {} - {} ".format(query_params, ex))
        db_session.query(DatasourceScanners).filter(and_(DatasourceScanners.datasource_id == datasource_id, DatasourceScanners.id == scanner_id)). \
            update({DatasourceScanners.in_progress: 0})
        db_connection().commit()
        return
    next_page_token = response["nextPageNumber"] if "nextPageNumber" in response else None
    if next_page_token:
        scanner.next_page_token = str(next_page_token)
        query_params["nextPageNumber"] = scanner.next_page_token
        messaging.trigger_get_event(urls.GITHUB_SCAN_ENTITIES, auth_token, query_params, "github")
    else:
        scanner.next_page_token = ""

    entities_list = response["payload"]
    fetched_entities_count = len(entities_list)

    in_progress = 0 if fetched_entities_count < 1 else 1
    db_session.query(DatasourceScanners).filter(and_(DatasourceScanners.datasource_id == datasource_id, DatasourceScanners.id == scanner_id)). \
            update({DatasourceScanners.total_count: DatasourceScanners.total_count + fetched_entities_count, 
            DatasourceScanners.query_status: DatasourceScanners.query_status + 1})
    
    if in_progress == 0:
        db_session.query(DatasourceScanners).filter(and_(DatasourceScanners.datasource_id == datasource_id, DatasourceScanners.id == scanner_id)). \
            update({DatasourceScanners.in_progress: in_progress})
        db_connection().commit()
        messaging.trigger_post_event(urls.GITHUB_SCAN_UPDATE, auth_token, query_params, {}, "github")
        return
    
    datasource_metric_column = get_datasource_column(scanner.scanner_type)
    if datasource_metric_column:
        db_session.query(DataSource).filter(DataSource.datasource_id == datasource_id). \
                update({datasource_metric_column: datasource_metric_column + fetched_entities_count})
    db_connection().commit()
    sent_member_count = 0
    batch_size = response["batchSize"] if "batchSize" in response else fetched_entities_count
    while sent_member_count < fetched_entities_count:
        scanner_data = {}
        scanner_data["entities"] = entities_list[sent_member_count:sent_member_count + batch_size]
        #If this is the last set of users, in the process call, send the next page number as empty
        if fetched_entities_count - sent_member_count <= batch_size and not scanner.next_page_token:
            query_params["nextPageNumber"] = ""
        messaging.trigger_post_event(urls.GITHUB_SCAN_ENTITIES, auth_token, query_params, scanner_data, "github")
        sent_member_count += batch_size

def process_scanner_data(auth_token, query_params, scanner_data):
    datasource_id = query_params["dataSourceId"]
    scanner_id = query_params["scannerId"]
    next_page_token = query_params["nextPageNumber"] if "nextPageNumber" in query_params else None

    db_session = db_connection().get_session()
    scanner = db_session.query(DatasourceScanners).filter(and_(DatasourceScanners.datasource_id == datasource_id, DatasourceScanners.id == scanner_id)).first()
    if not scanner:
        return
    
    scanner_processor = get_scanner_processor(scanner.scanner_type)
    processed_results = 0
    try:
        processed_results = scanner_processor.process(db_session, auth_token, query_params, scanner_data)
    except Exception as ex:
        Logger().exception("Exception occurred while processing scan data for - {} - {}".format(query_params, ex))
        return
    
    in_progress = 1
    if not next_page_token:
        in_progress = 0
        db_session.query(DatasourceScanners).filter(and_(DatasourceScanners.datasource_id == datasource_id, DatasourceScanners.id == scanner_id)). \
            update({DatasourceScanners.in_progress: in_progress})

    db_session.query(DatasourceScanners).filter(and_(DatasourceScanners.datasource_id == datasource_id, DatasourceScanners.id == scanner_id)). \
            update({DatasourceScanners.process_status: DatasourceScanners.process_status + 1, DatasourceScanners.processed_count: DatasourceScanners.processed_count + processed_results,
            DatasourceScanners.updated_at: datetime.utcnow()})
    
    datasource_metric_column = get_datasource_column(scanner.scanner_type, False)
    if datasource_metric_column:
        db_session.query(DataSource).filter(DataSource.datasource_id == datasource_id). \
                update({datasource_metric_column: datasource_metric_column + processed_results})
    db_connection().commit()
    datasource = db_session.query(DataSource).filter(and_(DataSource.datasource_id == datasource_id, DataSource.is_async_delete == False)).first()
    messaging.send_push_notification("adya-scan-update", json.dumps(datasource, cls=alchemy_encoder()))

    if in_progress == 0:
        scanner_processor.post_process(db_session, auth_token, query_params)
        messaging.trigger_post_event(urls.GITHUB_SCAN_UPDATE, auth_token, query_params, {}, "github")

def scan_complete_processing(db_session, auth_token, datasource_id):
    db_session.query(ResourcePermission).filter(ResourcePermission.datasource_id == datasource_id,
                                                        DomainUser.datasource_id == ResourcePermission.datasource_id,
                                                        DomainUser.user_id ==
                                                        ResourcePermission.permission_id). \
        update({ResourcePermission.email: DomainUser.email}, synchronize_session = 'fetch')
    db_connection().commit()
    datasource = db_session.query(DataSource).filter(and_(DataSource.datasource_id == datasource_id, DataSource.is_async_delete == False)).first()
    messaging.send_push_notification("adya-scan-update", json.dumps(datasource, cls=alchemy_encoder()))
    utils.add_license_for_scanned_app(db_session, datasource)

def get_datasource_column(scanner_type, is_total = True):
    column_name = None
    if scanner_type == github_constants.ScannerTypes.ORG_MEMBERS.value:
        column_name = DataSource.total_user_count if is_total else DataSource.processed_user_count
    elif scanner_type == github_constants.ScannerTypes.ORGANISATIONS.value:
        column_name = DataSource.total_group_count if is_total else DataSource.processed_group_count
    elif scanner_type == github_constants.ScannerTypes.REPOSITORIES.value:
        column_name = DataSource.total_file_count if is_total else DataSource.processed_file_count
    return column_name


def get_scanner_processor(scanner_type):
    scanner_processor = None
    if scanner_type == github_constants.ScannerTypes.REPOSITORIES.value:
        scanner_processor = repository_scanner
    elif scanner_type == github_constants.ScannerTypes.ORGANISATIONS.value:
        scanner_processor = organisation_scanner
    elif scanner_type == github_constants.ScannerTypes.REP_COLLABORATORS.value:
        scanner_processor = rep_collaborators_scanner
    elif scanner_type == github_constants.ScannerTypes.ORG_MEMBERS.value:
        scanner_processor = org_members_scanner
    return scanner_processor
