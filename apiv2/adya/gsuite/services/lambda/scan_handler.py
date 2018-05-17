from adya.gsuite import scan, incremental_scan
from adya.gsuite import drive_change_notification, incremental_scan, activity_change_notification
from adya.common.utils import utils
from adya.common.utils.request_session import RequestSession

from adya.core.controllers import actions_controller
from adya.common.utils.response_messages import Logger

def start_scan(event, context):
    req_session = RequestSession(event)
    req_error = req_session.validate_authorized_request(
        True, ['isAdmin','dataSourceId', 'domainId', 'serviceAccountEnabled'])
    if req_error:
        return req_error

    scan.start_scan(req_session.get_auth_token(), req_session.get_req_param(
        'domainId'), req_session.get_req_param('dataSourceId'),req_session.get_req_param('isAdmin'),
            req_session.get_req_param('serviceAccountEnabled'))
    return req_session.generate_response(202)

def get_drive_resources(event, context):
    req_session = RequestSession(event)
    req_error = req_session.validate_authorized_request(True, ['dataSourceId', 'domainId','ownerEmail'],
                                                         ['nextPageToken','userEmail'])
    if req_error:
        return req_error

    scan.get_resources(req_session.get_auth_token(), req_session.get_req_param('domainId'), 
                req_session.get_req_param('dataSourceId'),req_session.get_req_param('ownerEmail'),
                req_session.get_req_param('nextPageToken'),req_session.get_req_param('userEmail'))
    return req_session.generate_response(202)

def process_drive_resources(event, context):
    req_session = RequestSession(event)
    req_error = req_session.validate_authorized_request(
        True, ['dataSourceId', 'domainId'],['userEmail', 'is_incremental_scan'])
    if req_error:
        return req_error
    is_incremental_scan = req_session.get_req_param('is_incremental_scan')
    is_incremental_scan = 0 if is_incremental_scan is None else is_incremental_scan
    scan.process_resource_data(req_session.get_auth_token(), req_session.get_req_param('domainId'),
                               req_session.get_req_param('dataSourceId'), req_session.get_req_param('userEmail'),
                               req_session.get_body(), is_incremental_scan)
    return req_session.generate_response(202)

def get_domain_users(event, context):
    req_session = RequestSession(event)
    req_error = req_session.validate_authorized_request(
        True, ['dataSourceId', 'domainId'],["nextPageToken"])
    if req_error:
        return req_error

    domain_id = req_session.get_req_param('domainId')
    datasource_id = req_session.get_req_param('dataSourceId')
    next_page_token = req_session.get_req_param('nextPageToken')
    auth_token =  req_session.get_auth_token()

    scan.getDomainUsers(datasource_id, auth_token, domain_id, next_page_token)
    return req_session.generate_response(202)

def process_domain_users(event, context):
    req_session = RequestSession(event)
    req_error = req_session.validate_authorized_request(
        True, ['dataSourceId', 'domainId'])
    if req_error:
        return req_error

    domain_id = req_session.get_req_param('domainId')
    datasource_id = req_session.get_req_param('dataSourceId')

    data = req_session.get_body()
    users_response_data = data.get("usersResponseData")
    scan.processUsers(req_session.get_auth_token(), users_response_data, datasource_id, domain_id)
    return req_session.generate_response(202)


def get_domain_groups(event, context):
    req_session = RequestSession(event)
    req_error = req_session.validate_authorized_request(
        True, ['dataSourceId', 'domainId'],["nextPageToken"])
    if req_error:
        return req_error

    domain_id = req_session.get_req_param('domainId')
    datasource_id = req_session.get_req_param('dataSourceId')
    next_page_token = req_session.get_req_param('nextPageToken')
    auth_token =  req_session.get_auth_token()

    scan.getDomainGroups(datasource_id, auth_token , domain_id, next_page_token)
    return req_session.generate_response(202)

def process_domain_groups(event, context):
    req_session = RequestSession(event)
    req_error = req_session.validate_authorized_request(
        True, ['dataSourceId', 'domainId'])
    if req_error:
        return req_error

    domain_id = req_session.get_req_param('domainId')
    datasource_id = req_session.get_req_param('dataSourceId')
    auth_token = req_session.get_auth_token()
    data = req_session.get_body()
    group_response_data = data.get("groupsResponseData")

    scan.processGroups(group_response_data, datasource_id ,domain_id, auth_token)
    return req_session.generate_response(202)


def get_group_members(event, context):
    req_session = RequestSession(event)
    req_error = req_session.validate_authorized_request(
        True, ['dataSourceId', 'domainId'])
    if req_error:
        return req_error

    data = req_session.get_body()
    domain_id = req_session.get_req_param('domainId')
    datasource_id = req_session.get_req_param('dataSourceId')
    group_keys = data.get('groupKeys')

    scan.get_group_data(req_session.get_auth_token(), domain_id,datasource_id, group_keys)
    return req_session.generate_response(202)


def get_user_app(event,context):
    req_session = RequestSession(event)
    req_error = req_session.validate_authorized_request(
        True, ['dataSourceId', 'domainId'])
    if req_error:
        return req_error

    data = req_session.get_body()
    domain_id = req_session.get_req_param('domainId')
    datasource_id = req_session.get_req_param('dataSourceId')
    user_email_list = data.get('userEmailList')
    scan.get_all_user_app(req_session.get_auth_token(), domain_id,datasource_id, user_email_list)
    return req_session.generate_response(202)


def subscribe_gdrive_notifications(event, context):
    req_session = RequestSession(event)
    req_error = req_session.validate_authorized_request(True, ["domainId", "dataSourceId"])
    if req_error:
        return req_error

    incremental_scan.subscribe(req_session.get_req_param('domainId'), req_session.get_req_param('dataSourceId'))
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

def process_activity_change_notifications(event, context):
    req_session = RequestSession(event)
    req_error = req_session.validate_authorized_request(False, mandatory_params=[], optional_params=[], headers=['X-Goog-Channel-Token', 'X-Goog-Channel-ID', 'X-Goog-Resource-State'])
    if req_error:
        return req_error

    datasource_id = req_session.get_req_header('X-Goog-Channel-Token')
    channel_id = req_session.get_req_header('X-Goog-Channel-ID')
    notification_type = req_session.get_req_header('X-Goog-Resource-State')
    activity_change_notification.process_notifications_for_activity_watch(notification_type, datasource_id, channel_id, req_session.get_body())
    return req_session.generate_response(202)    


def handle_channel_expiration(event, context):
    req_session = RequestSession(event)
    req_error = req_session.validate_authorized_request(False)
    if req_error:
        return req_error

    response = incremental_scan.handle_channel_expiration()
    return req_session.generate_response(202)

def gdrive_periodic_changes_poll(event, context):
    req_session = RequestSession(event)
    req_error = req_session.validate_authorized_request(False, optional_params=['datasource_id'])
    if req_error:
        return req_error

    response = incremental_scan.gdrive_periodic_changes_poll(req_session.get_req_param('datasource_id'))
    return req_session.generate_response(200)



