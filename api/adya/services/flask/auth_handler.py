import urlparse

from flask_restful import Resource, reqparse, request
from adya.datasources.google import auth
from adya.controllers import auth_controller
from adya.datasources.google import gutils
from adya.common.request_session import RequestSession


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
        req_error = req_session.validate_authorized_request(False, [], ['scope', 'code', 'error'])
        if req_error:
            return req_error

        url = auth.oauth_callback(req_session.get_req_param('code'), req_session.get_req_param('scope'), req_session.get_req_param('error'))
        if not url:
            req_session.generate_error_response(401, "Not authenticated")
        else:
            return req_session.generate_redirect_response(url)


class get_user_session(Resource):
    def get(self):
        req_session = RequestSession(request)
        req_error = req_session.validate_authorized_request()
        if req_error:
            return req_error
            
        user_session = auth_controller.get_user_session(req_session.get_auth_token())

        if not user_session:
            return req_session.generate_error_response(401, "User session not found")
        else:
            return req_session.generate_response(200, user_session)


class RevokeAccessForApp(Resource):
    def delete(self):
        data = request.data
        domain_id = data.get("domainId")
        gutils.revoke_appaccess(domain_id)
        return "Success Removed", 200
