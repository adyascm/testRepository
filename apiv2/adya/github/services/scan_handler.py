
from adya.common.utils.request_session import RequestSession
from adya.github.scanners import scanner_facade

def start_scan(event, context):
    req_session = RequestSession(event)
    req_error = req_session.validate_authorized_request(
        True, ['dataSourceId', 'domainId', 'userEmail'])
    if req_error:
        return req_error

    scanner_facade.start_scan(req_session.get_auth_token(), req_session.get_req_param('dataSourceId'),
                          req_session.get_req_param('domainId'), req_session.get_req_param('userEmail'))

    return req_session.generate_response(200)

def request_scanner_data(event, context):
    req_session = RequestSession(event)
    req_error = req_session.validate_authorized_request(True, ['dataSourceId', 'domainId', 'scannerId'], ['repo_name', 'org_name', 'repo_id'])
    if req_error:
        return req_error
    
    scanner_facade.request_scanner_data(req_session.get_auth_token(), req_session.get_all_req_param())
    return req_session.generate_response(202)

def process_scanner_data(event, context):
    req_session = RequestSession(event)
    req_error = req_session.validate_authorized_request(True, ['dataSourceId', 'domainId', 'scannerId'], ['repo_name', 'org_name', 'repo_id'])
    if req_error:
        return req_error

    scanner_facade.process_scanner_data(req_session.get_auth_token(), req_session.get_all_req_param(),
        req_session.get_body())
    return req_session.generate_response(202)

def update_scan(event, context):
    req_session = RequestSession(event)
    req_error = req_session.validate_authorized_request(True, ['dataSourceId', 'domainId'])
    if req_error:
        return req_error
    
    scanner_facade.update_scan(req_session.get_auth_token(), req_session.get_req_param('dataSourceId'),
        req_session.get_req_param('domainId'))
    return req_session.generate_response(202)