from adya.common.utils.request_session import RequestSession
from adya.slack.authorizers import oauth


def slack_oauth_request(event, context):
    req_session = RequestSession(event)
    req_error = req_session.validate_authorized_request(False, ['authtoken'], ['scope'])
    if req_error:
        return req_error

    url = oauth.request_oauth(req_session.get_req_param('scope'), req_session.get_req_param('authtoken'))
    return req_session.generate_redirect_response(url)


def slack_oauth_callback(event, context):
    req_session = RequestSession(event)
    req_error = req_session.validate_authorized_request(False, [], ['code', 'state'])
    if req_error:
        return req_error

    url = oauth.oauth_callback(req_session.get_req_param('code'), req_session.get_req_param('state'))
    if not url:
        req_session.generate_error_response(401, "Not authenticated")
    else:
        return req_session.generate_redirect_response(url)

