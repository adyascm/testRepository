from adya.common.utils.request_session import RequestSession
from adya.slack import scan


def start_scan(event, context):
    req_session = RequestSession(event)
    req_error = req_session.validate_authorized_request(
        True, ['dataSourceId', 'domainId'])
    if req_error:
        return req_error

    scan.start_slack_scan(req_session.get_auth_token(), req_session.get_req_param('dataSourceId'),
                          req_session.get_req_param('domainId'))

    return req_session.generate_response(202)


def get_slack_resources(event, context):
    req_session = RequestSession(event)
    req_error = req_session.validate_authorized_request(True, ['dataSourceId'], ['nextPageNumber'])
    if req_error:
        return req_error

    scan.get_slack_files(req_session.get_auth_token(),
                         req_session.get_req_param('dataSourceId'),
                         req_session.get_req_param('nextPageNumber'))

    return req_session.generate_response(202)


def process_slack_resources(event, context):
    req_session = RequestSession(event)
    req_error = req_session.validate_authorized_request(
        True, ['dataSourceId'])
    if req_error:
        return req_error
    scan.process_slack_files(req_session.get_req_param('dataSourceId'), req_session.get_body())
    return req_session.generate_response(202)


def get_slack_users(event, context):
    req_session = RequestSession(event)
    req_error = req_session.validate_authorized_request(
        True, ['dataSourceId', 'domainId'], ['nextCursor'])
    if req_error:
        return req_error

    scan.get_slack_users(req_session.get_auth_token(),
                         req_session.get_req_param('domainId'),
                         req_session.get_req_param('dataSourceId'),
                         req_session.get_req_param('nextCursor'))
    return req_session.generate_response(202)


def process_slack_users(event, context):
    req_session = RequestSession(event)
    req_error = req_session.validate_authorized_request(
        True, ['dataSourceId', 'domainId'])
    if req_error:
        return req_error

    scan.process_slack_users(req_session.get_req_param('dataSourceId'), req_session.get_req_param('domainId'),
                             req_session.get_body())
    return req_session.generate_response(202)


def get_slack_channels(event, context):
    req_session = RequestSession(event)
    req_error = req_session.validate_authorized_request(
        True, ['dataSourceId'], ['nextCursor'])
    if req_error:
        return req_error

    scan.get_slack_channels(req_session.get_auth_token(),
                            req_session.get_req_param('dataSourceId'),
                            req_session.get_req_param('nextCursor'))
    return req_session.generate_response(202)


def process_slack_channels(event, context):
    req_session = RequestSession(event)
    req_error = req_session.validate_authorized_request(
        True, ['dataSourceId'])
    if req_error:
        return req_error

    scan.process_slack_channels(req_session.get_req_param('dataSourceId'), req_session.get_body())
    return req_session.generate_response(202)

