from adya.common.utils.request_session import RequestSession
from adya.github.authorizers import oauth

def github_oauth_request(event, context):
    req_session = RequestSession(event)
    req_error = req_session.validate_authorized_request(False, ['authToken'])
    if req_error:
        return req_error
    url = oauth.oauth_request(req_session.get_req_param('authToken'))
    return req_session.generate_redirect_response(url)

def github_oauth_callback(event, context):
    req_session = RequestSession(event)
    req_error = req_session.validate_authorized_request(False, [], ['code', 'state'])
    if req_error:
        return req_error
    url = oauth.oauth_callback(req_session.get_req_param('code'), req_session.get_req_param('state'))
    if not url:
        return req_session.generate_error_response(401, "Not Authenticated")
    else:
        return req_session.generate_redirect_response(url)