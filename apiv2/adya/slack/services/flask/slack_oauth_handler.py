from flask_restful import Resource, request

from adya.common.utils.request_session import RequestSession
from adya.slack import auth


class slack_oauth_request(Resource):
    def get(self):
        req_session = RequestSession(request)
        req_error = req_session.validate_authorized_request(False, [], ['scope'])
        if req_error:
            return req_error

        url = auth.request_oauth(req_session.get_req_param('scope'))
        return req_session.generate_redirect_response(url)


class slack_oauth_callback(Resource):
    def get(self):
        req_session = RequestSession(request)
        req_error = req_session.validate_authorized_request(False, [], ['code', 'state'])
        if req_error:
            return req_error
        url = auth.oauth_callback(req_session.get_req_param('code'), req_session.get_req_param('state'))
        if not url:
            req_session.generate_error_response(401, "Not authenticated")
        else:
            return req_session.generate_redirect_response(url)