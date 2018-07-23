import json, time, uuid
from datetime import datetime

from sqlalchemy.orm.exc import StaleDataError
from sqlalchemy import and_

from adya.common.db.models import DomainUser, DataSource, alchemy_encoder, \
    Application, ApplicationUserAssociation, DatasourceScanners, AppInventory, AppLicenseInventory

from adya.common.db.connection import db_connection

from adya.common.utils import messaging, utils

from adya.common.constants import urls, constants
from adya.common.utils.response_messages import Logger
from adya.slack import slack_utils, slack_constants
from adya.slack.scanners import users_scanner, channels_scanner, apps_scanner, files_scanner

def start_scan(auth_token, datasource_id, domain_id, user_email):
    db_session = db_connection().get_session()
    scanner_types = [slack_constants.ScannerTypes.APPS.value, slack_constants.ScannerTypes.USERS.value, 
        slack_constants.ScannerTypes.CHANNELS.value]
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
        query_params = {"dataSourceId": datasource_id, "domainId": domain_id, "scannerId": scanner.id, "change_type": slack_constants.AppChangedTypes.ADDED.value }
        messaging.trigger_get_event(urls.SCAN_SLACK_ENTITIES, auth_token, query_params, "slack")

def update_scan(auth_token, datasource_id, domain_id):
    time.sleep(5)
    db_session = db_connection().get_session()
    scan_complete = db_session.query(DatasourceScanners).filter(and_(DatasourceScanners.datasource_id == datasource_id, DatasourceScanners.in_progress > 0)).count()
    #print "Total scanners in progress - {}".format(scan_complete)
    if scan_complete == 0:
        scan_complete = db_session.query(DataSource).filter(and_(DataSource.datasource_id == datasource_id, DataSource.is_push_notifications_enabled != 1)). \
                update({DataSource.is_push_notifications_enabled: 1})
        Logger().info("update_scan: scan_complete - {}".format(scan_complete))
        #print "Scan complete status - {}".format(scan_complete)
        if scan_complete > 0:
            Logger().info("update_scan : call Scan completed processing method")
            scan_complete_processing(db_session, auth_token, datasource_id)

def request_scanner_data(auth_token, query_params):
    #try:
    datasource_id = query_params["dataSourceId"]
    scanner_id = query_params["scannerId"]
    
    db_session = db_connection().get_session()
    scanner = db_session.query(DatasourceScanners).filter(and_(DatasourceScanners.datasource_id == datasource_id, DatasourceScanners.id == scanner_id)).first()
    if not scanner:
        return
    
    response = get_scanner_processor(scanner.scanner_type).query(auth_token, query_params, scanner)
    next_page_token = response["nextPageNumber"]
    if next_page_token:
        scanner.page_token = str(next_page_token)
        query_params["nextPageNumber"] = scanner.page_token
        messaging.trigger_get_event(urls.SCAN_SLACK_ENTITIES, auth_token, query_params, "slack")
    else:
        scanner.page_token = ""

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
        messaging.trigger_post_event(urls.SCAN_SLACK_UPDATE, auth_token, query_params, {}, "slack")
        return
    
    datasource_metric_column = get_datasource_column(scanner.scanner_type)
    if datasource_metric_column:
        db_session.query(DataSource).filter(DataSource.datasource_id == datasource_id). \
                update({datasource_metric_column: datasource_metric_column + fetched_entities_count})
    db_connection().commit()
    #datasource = db_session.query(DataSource).filter(and_(DataSource.datasource_id == datasource_id, DataSource.is_async_delete == False)).first()
    #messaging.send_push_notification("adya-scan-update", json.dumps(datasource, cls=alchemy_encoder()))
    #db_connection().close_connection()
    sent_member_count = 0
    while sent_member_count < fetched_entities_count:
        scanner_data = {}
        scanner_data["entities"] = entities_list[sent_member_count:sent_member_count + 30]
        #If this is the last set of users, in the process call, send the next page number as empty
        if fetched_entities_count - sent_member_count <= 30 and not scanner.page_token:
            query_params["nextPageNumber"] = ""
        messaging.trigger_post_event(urls.SCAN_SLACK_ENTITIES, auth_token, query_params, scanner_data, "slack")
        sent_member_count += 30
    # except Exception as ex:
    #     print ex.message

def process_scanner_data(auth_token, query_params, scanner_data):
    datasource_id = query_params["dataSourceId"]
    scanner_id = query_params["scannerId"]
    next_page_token = query_params["nextPageNumber"]

    db_session = db_connection().get_session()
    scanner = db_session.query(DatasourceScanners).filter(and_(DatasourceScanners.datasource_id == datasource_id, DatasourceScanners.id == scanner_id)).first()
    if not scanner:
        return
    
    scanner_processor = get_scanner_processor(scanner.scanner_type)
    processed_results = scanner_processor.process(db_session, auth_token, query_params, scanner_data)
    
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
        messaging.trigger_post_event(urls.SCAN_SLACK_UPDATE, auth_token, query_params, {}, "slack")

def get_scanner_processor(scanner_type):
    scanner_processor = None
    if scanner_type == slack_constants.ScannerTypes.USERS.value:
        scanner_processor = users_scanner
    elif scanner_type == slack_constants.ScannerTypes.CHANNELS.value:
        scanner_processor = channels_scanner
    elif scanner_type == slack_constants.ScannerTypes.APPS.value:
        scanner_processor = apps_scanner
    elif scanner_type == slack_constants.ScannerTypes.FILES.value:
        scanner_processor = files_scanner
    return scanner_processor

def get_datasource_column(scanner_type, is_total = True):
    column_name = None
    if scanner_type == slack_constants.ScannerTypes.USERS.value:
        column_name = DataSource.total_user_count if is_total else DataSource.processed_user_count
    elif scanner_type == slack_constants.ScannerTypes.CHANNELS.value:
        column_name = DataSource.total_group_count if is_total else DataSource.processed_group_count
    elif scanner_type == slack_constants.ScannerTypes.FILES.value:
        column_name = DataSource.total_file_count if is_total else DataSource.processed_file_count
    return column_name

def scan_complete_processing(db_session, auth_token, datasource_id):
    Logger().info("Scan completed")
    db_session.query(ApplicationUserAssociation).filter(ApplicationUserAssociation.datasource_id == datasource_id,
                                                        DomainUser.datasource_id == datasource_id,
                                                        DomainUser.user_id ==
                                                        ApplicationUserAssociation.user_email). \
        update({ApplicationUserAssociation.user_email: DomainUser.email}, synchronize_session = 'fetch')

    db_connection().commit()
    datasource = db_session.query(DataSource).filter(and_(DataSource.datasource_id == datasource_id, DataSource.is_async_delete == False)).first()
    messaging.send_push_notification("adya-scan-update", json.dumps(datasource, cls=alchemy_encoder()))
    utils.add_license_for_scanned_app(db_session, datasource)
    query_params = {'dataSourceId': datasource_id}
    messaging.trigger_post_event(urls.CREATE_DEFAULT_POLICES_PATH, auth_token, query_params, {})
