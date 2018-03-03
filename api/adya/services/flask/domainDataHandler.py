
from flask_restful import Resource, reqparse, request
from adya.controllers import domainDataController
from adya.common.request_session import RequestSession

class UserGroupTree(Resource):
    def get(self):
        req_session = RequestSession(request)
        req_error = req_session.validate_authorized_request()
        if req_error:
            return req_error
        auth_token = req_session.get_auth_token()
        user_group_tree = domainDataController.get_user_group_tree(auth_token)
        return req_session.generate_sqlalchemy_response(200, user_group_tree)

class UserApps(Resource):
    def get(self):
        req_session = RequestSession(request)
        req_error = req_session.validate_authorized_request()
        if req_error:
            return req_error
        auth_token = req_session.get_auth_token()
        apps = domainDataController.get_apps(auth_token)
        return req_session.generate_sqlalchemy_response(200, apps)