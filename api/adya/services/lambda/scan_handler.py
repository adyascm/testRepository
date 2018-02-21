from adya.datasources.google import scan, permission
from adya.common import utils
from adya.common.request_session import RequestSession
from adya.datasources.google import incremental_scan


def get_drive_resources(event, context):
    print "started initial gdrive scan"
    req_session = RequestSession(event)
    req_error = req_session.validate_authorized_request(
        True, ['dataSourceId', 'domainId'], ['nextPageToken','userEmail'])
    if req_error:
        return req_error

    scan.get_resources(req_session.get_auth_token(), req_session.get_req_param('domainId'), req_session.get_req_param(
        'dataSourceId'),req_session.get_req_param('nextPageToken'),req_session.get_req_param('userEmail'))
    return req_session.generate_response(202)

def process_drive_resources(event, context):
    print "Processing Data"
    req_session = RequestSession(event)
    req_error = req_session.validate_authorized_request(
        True, ['dataSourceId', 'domainId'],['userEmail'])
    if req_error:
        return req_error

    scan.process_resource_data(req_session.get_auth_token(), req_session.get_req_param(
        'domainId'), req_session.get_req_param('dataSourceId'), req_session.get_req_param('userEmail'), req_session.get_body())
    return req_session.generate_response(202)


def process_resource_permissions(event, context):
    print "Getting Permission Data"
    req_session = RequestSession(event)
    req_error = req_session.validate_authorized_request(
        True, ['dataSourceId', 'domainId'],['userEmail'])
    if req_error:
        return req_error

    requestdata = req_session.get_body()
    fileIds = requestdata['fileIds']
    domain_id = req_session.get_req_param('domainId')
    datasource_id = req_session.get_req_param('dataSourceId')
    user_email = req_session.get_req_param('userEmail')
    ## creating the instance of scan_permission class
    scan_permisssion_obj = permission.GetPermission(domain_id, datasource_id , fileIds)
    ## calling get permission api
    scan_permisssion_obj.get_permission(user_email)
    return req_session.generate_response(202)


def get_domain_users(event, context):
    print("Getting domain user")
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
    print("Process users data")
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
    print("Getting domain groups")
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
    print("Process groups data")
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
        True, ['dataSourceId', 'domainId','groupKey'],['nextPageToken'])
    if req_error:
        return req_error

    domain_id = req_session.get_req_param('domainId')
    datasource_id = req_session.get_req_param('dataSourceId')
    group_key = req_session.get_req_param('groupKey')
    next_page_token = req_session.get_req_param('nextPageToken')
    auth_token = req_session.get_auth_token()
    scan.getGroupsMember(group_key, auth_token, datasource_id, domain_id, next_page_token)

    return req_session.generate_response(202)
    
def process_group_members(event, context):
    req_session = RequestSession(event)
    req_error = req_session.validate_authorized_request(
        True, ['dataSourceId', 'domainId', 'groupKey'])
    if req_error:
        return req_error

    data = req_session.get_body()
    domain_id = req_session.get_req_param('domainId')
    datasource_id = req_session.get_req_param('dataSourceId')
    group_key = req_session.get_req_param('groupKey')
    member_response_data = data.get("membersResponseData")

    scan.processGroupMembers(req_session.get_auth_token(), group_key, member_response_data, datasource_id , domain_id)
    return req_session.generate_response(202)


def subscribe_gdrive_notifications(event, context):
        req_session = RequestSession(event)
        req_error = req_session.validate_authorized_request()
        if req_error:
            return req_error

        domain_id = req_session.get_req_param('domain_id')
        print "Subscribing push notifications for domain_id: ", domain_id
        incremental_scan.subscribe(domain_id)
        return req_session.generate_response(202, "Subscription successful")


def process_gdrive_notifications(event, context):
    req_session = RequestSession(event)
    req_error = req_session.validate_authorized_request(headers=['X-Goog-Channel-Token', 'X-Goog-Channel-ID'])
    if req_error:
        return req_error

    domain_id = req_session.get_req_header('X-Goog-Channel-Token')
    channel_id = req_session.get_req_header('X-Goog-Channel-ID')
    print "Processing notifications for ", domain_id, " on channel: ", channel_id
    incremental_scan.process_notifications(domain_id, channel_id)
    return req_session.generate_response(202, "Finished processing notifications. ")

