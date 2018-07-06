from adya.gsuite.scanners import scanner_facade
from adya.gsuite.synchronizers import incremental_scan, drive_change_notification, activity_notification
from adya.common.utils import utils
from adya.common.utils.request_session import RequestSession

from adya.core.controllers import actions_controller

def start_scan(event, context):
    req_session = RequestSession(event)
    req_error = req_session.validate_authorized_request(
        True, ['dataSourceId', 'domainId', 'userEmail'])
    if req_error:
        return req_error

    scanner_facade.start_scan(req_session.get_auth_token(), req_session.get_req_param('dataSourceId'),
                          req_session.get_req_param('domainId'), req_session.get_req_param('userEmail'))

    return req_session.generate_response(200)

def update_scan(event, context):
    req_session = RequestSession(event)
    req_error = req_session.validate_authorized_request(
        True, ['dataSourceId', 'domainId'])
    if req_error:
        return req_error

    scanner_facade.update_scan(req_session.get_auth_token(), req_session.get_req_param('dataSourceId'),
                          req_session.get_req_param('domainId'))

    return req_session.generate_response(202)

def request_scanner_data(event, context):
    req_session = RequestSession(event)
    req_error = req_session.validate_authorized_request(True, ['domainId','dataSourceId', 'scannerId'], ['userEmail', 'nextPageNumber', 'groupEmail', 'ownerEmail'])
    if req_error:
        return req_error

    scanner_facade.request_scanner_data(req_session.get_auth_token(), req_session.get_all_req_param())

    return req_session.generate_response(200)

def process_scanner_data(event, context):
    req_session = RequestSession(event)
    req_error = req_session.validate_authorized_request(True, ['domainId','dataSourceId', 'scannerId'], ['userEmail', 'nextPageNumber', 'groupEmail', 'ownerEmail'])
    if req_error:
        return req_error
    scanner_facade.process_scanner_data(req_session.get_auth_token(), 
                            req_session.get_all_req_param(), req_session.get_body())
    return req_session.generate_response(200)

def subscribe_gdrive_notifications(event, context):
    req_session = RequestSession(event)
    req_error = req_session.validate_authorized_request(True, ["domainId", "dataSourceId"], ["pageNum"])
    if req_error:
        return req_error

    incremental_scan.subscribe(req_session.get_auth_token(), req_session.get_req_param('domainId'), req_session.get_req_param('dataSourceId'), req_session.get_req_param('pageNum'))
    return req_session.generate_response(202)


def process_drive_change_notifications(event, context):
    req_session = RequestSession(event)
    req_error = req_session.validate_authorized_request(False, mandatory_params=[], optional_params=[], headers=['X-Goog-Channel-Token', 'X-Goog-Channel-ID', 'X-Goog-Resource-State'])
    if req_error:
        return req_error

    datasource_id = req_session.get_req_header('X-Goog-Channel-Token')
    channel_id = req_session.get_req_header('X-Goog-Channel-ID')
    notification_type = req_session.get_req_header('X-Goog-Resource-State')
    drive_change_notification.process_notifications(notification_type, datasource_id, channel_id)
    return req_session.generate_response(202)

def process_activity_notifications(event, context):
    req_session = RequestSession(event)
    req_error = req_session.validate_authorized_request(False, mandatory_params=[], optional_params=[], headers=['X-Goog-Channel-Token', 'X-Goog-Channel-ID', 'X-Goog-Resource-State'])
    if req_error:
        return req_error

    datasource_id = req_session.get_req_header('X-Goog-Channel-Token')
    channel_id = req_session.get_req_header('X-Goog-Channel-ID')
    notification_type = req_session.get_req_header('X-Goog-Resource-State')
    activity_notification.process_notifications(notification_type, datasource_id, channel_id, req_session.get_body())
    return req_session.generate_response(202)    


def handle_channel_expiration(event, context):
    req_session = RequestSession(event)
    req_error = req_session.validate_authorized_request(False, optional_params=['page_num'])
    if req_error:
        return req_error

    response = incremental_scan.handle_channel_expiration(req_session.get_req_param('page_num'))
    return req_session.generate_response(202)

def gdrive_periodic_changes_poll(event, context):
    req_session = RequestSession(event)
    req_error = req_session.validate_authorized_request(False, optional_params=['datasource_id'])
    if req_error:
        return req_error

    incremental_scan.gdrive_periodic_changes_poll(req_session.get_req_param('datasource_id'))
    return req_session.generate_response(200)