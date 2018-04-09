import urlparse

from flask_restful import Resource, reqparse, request
from adya.gsuite import auth
from adya.common.utils.request_session import RequestSession


class google_oauth_request(Resource):
    def get(self):
        req_session = RequestSession(request)
        req_error = req_session.validate_authorized_request(False, [], ['scope'])
        if req_error:
            return req_error

        url = auth.oauth_request(req_session.get_req_param('scope'))
        return req_session.generate_redirect_response(url)


class google_oauth_callback(Resource):
    def get(self):
        req_session = RequestSession(request)
        req_error = req_session.validate_authorized_request(False, [], ['scope', 'code', 'state', 'error'])
        if req_error:
            return req_error
        url = auth.oauth_callback(req_session.get_req_param('code'), req_session.get_req_param('scope'),req_session.get_req_param('state'), req_session.get_req_param('error'))
        if not url:
            req_session.generate_error_response(401, "Not authenticated")
        else:
            return req_session.generate_redirect_response(url)


