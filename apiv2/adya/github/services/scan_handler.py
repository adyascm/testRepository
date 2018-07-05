
from adya.common.utils.request_session import RequestSession
from adya.github.scanners import scan, members_scanner, repository_scanner, scanner_facade

# def start_github_scan(event, context):
#     req_session = RequestSession(event)
#     req_error = req_session.validate_authorized_request(True, ['datasource_id', 'domain_id'])
#     if req_error:
#         return req_error
    
#     scan.start_github_scan(req_session.get_auth_token(), req_session.get_req_param('datasource_id'), req_session.get_req_param('domain_id'))
#     return req_session.generate_response(202)

# def process_github_users(event, context):
#     req_session = RequestSession(event)
#     req_error = req_session.validate_authorized_request(True, ['datasource_id', 'domain_id'])
#     if req_error:
#         return req_error
    
#     members_scanner.process_github_users(req_session.get_auth_token(), req_session.get_req_param('datasource_id'),
#         req_session.get_req_param('domain_id'), req_session.get_body())
#     return req_session.generate_response(202)

# def get_github_users(event, context):
#     req_session = RequestSession(event)
#     req_error = req_session.validate_authorized_request(True, ['datasource_id', 'domain_id'])
#     if req_error:
#         return req_error
    
#     members_scanner.get_github_users(req_session.get_auth_token(), req_session.get_req_param('datasource_id'), 
#         req_session.get_req_param('domain_id'))
#     return req_session.generate_response(202)

# def process_github_repository(event, context):
#     req_session = RequestSession(event)
#     req_error = req_session.validate_authorized_request(True, ['datasource_id', 'domain_id'])
#     if req_error:
#         return req_error
    
#     repository_scanner.process_github_repository(req_session.get_auth_token(), req_session.get_req_param('datasource_id'),
#         req_session.get_req_param('domain_id'), req_session.get_body())
#     return req_session.generate_response(202)

def request_scanner_data(event, context):
    req_session = RequestSession(event)
    req_error = req_session.validate_authorized_request(True, ['datasource_id', 'domain_id', 'scanner_id', 'change_type'], ['repo_name', 'org_name', 'repo_id'])
    if req_error:
        return req_error
    
    scanner_facade.request_scanner_data(req_session.get_auth_token(), req_session.get_all_req_param())
    return req_session.generate_response(202)

def process_scanner_data(event, context):
    req_session = RequestSession(event)
    req_error = req_session.validate_authorized_request(True, ['datasource_id', 'domain_id', 'scanner_id', 'change_type'], ['repo_name', 'org_name', 'repo_id'])
    if req_error:
        return req_error

    scanner_facade.process_scanner_data(req_session.get_auth_token(), req_session.get_all_req_param(),
        req_session.get_body())
    return req_session.generate_response(202)

def update_scan(event, context):
    req_session = RequestSession(event)
    req_error = req_session.validate_authorized_request(True, ['datasource_id', 'domain_id'])
    if req_error:
        return req_error
    
    scanner_facade.update_scan(req_session.get_auth_token(), req_session.get_req_param('datasource_id'),
        req_session.get_req_param('domain_id'))
    return req_session.generate_response(202)