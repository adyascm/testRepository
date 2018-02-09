from adya.datasources.google import scan, permission
from adya.common import utils
from adya.common.request_session import RequestSession


def get_drive_resources(self):
    print "started initial gdrive scan"
    req_session = RequestSession(request)
    req_error = req_session.validate_authorized_request(
        True, ['dataSourceId', 'domainId'], ['next_page_token'])
    if req_error:
        return req_error

    scan.get_resources(req_session.get_auth_token(), req_session.get_req_param('domainId'), req_session.get_req_param(
        'dataSourceId'))
    return req_session.generate_response(202)

def process_drive_resources(self):
    print "Processing Data"
    req_session = RequestSession(request)
    req_error = req_session.validate_authorized_request(
        True, ['dataSourceId', 'domainId'])
    if req_error:
        return req_error

    scan.process_resource_data(req_session.get_auth_token(), req_session.get_req_param(
        'domainId'), req_session.get_req_param('dataSourceId'), req_session.get_body())
    return req_session.generate_response(202)


def process_resource_permissions(self):
    print "Getting Permission Data"
    req_session = RequestSession(request)
    req_error = req_session.validate_authorized_request(
        True, ['dataSourceId', 'domainId'])
    if req_error:
        return req_error

    requestdata = utils.get_json_object(request.data)
    fileIds = requestdata['fileIds']
    domain_id = req_session.get_req_param('domainId')
    datasource_id = req_session.get_req_param('dataSourceId')
    ## creating the instance of scan_permission class
    scan_permisssion_obj = permission.GetPermission(domain_id, datasource_id , fileIds)
    ## calling get permission api
    scan_permisssion_obj.get_permission()
    return req_session.generate_response(202)


def get_domain_users(self):
    print("Getting domain user")
    req_session = RequestSession(request)
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

def process_domain_users(self):
    print("Process users data")
    req_session = RequestSession(request)
    req_error = req_session.validate_authorized_request(
        True, ['dataSourceId', 'domainId'])
    if req_error:
        return req_error

    domain_id = req_session.get_req_param('domainId')
    datasource_id = req_session.get_req_param('dataSourceId')

    data = utils.get_json_object(request.data)
    users_response_data = data.get("usersResponseData")
    scan.processUsers(users_response_data, datasource_id, domain_id)
    return req_session.generate_response(202)


def get_domain_groups(self):
    print("Getting domain groups")
    req_session = RequestSession(request)
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

def process_domain_groups(self):
    print("Process groups data")
    req_session = RequestSession(request)
    req_error = req_session.validate_authorized_request(
        True, ['dataSourceId', 'domainId'])
    if req_error:
        return req_error

    domain_id = req_session.get_req_param('domainId')
    datasource_id = req_session.get_req_param('dataSourceId')
    auth_token = req_session.get_auth_token()
    data = utils.get_json_object(request.data)
    group_response_data = data.get("groupsResponseData")

    scan.processGroups(group_response_data, datasource_id ,domain_id, auth_token)
    return req_session.generate_response(202)


def get_group_members(self):
    req_session = RequestSession(request)
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
    
def process_group_members(self):
    req_session = RequestSession(request)
    req_error = req_session.validate_authorized_request(
        True, ['dataSourceId', 'domainId', 'groupKey'])
    if req_error:
        return req_error

    data = utils.get_json_object(request.data)
    domain_id = req_session.get_req_param('domainId')
    datasource_id = req_session.get_req_param('dataSourceId')
    group_key = req_session.get_req_param('groupKey')
    member_response_data = data.get("membersResponseData")

    scan.processGroupMembers(group_key, member_response_data, datasource_id , domain_id)
    return req_session.generate_response(202)
