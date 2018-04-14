import json
from flask_restful import request, Resource
from adya.gsuite import actions
from adya.common.utils.request_session import RequestSession


class Actions(Resource):
    def post(self):
        req_session = RequestSession(request)
        req_error = req_session.validate_authorized_request(True, ['user_email','initiated_by_email', 'datasource_id'])
        if req_error:
            return req_error
        body = req_session.get_body()
        if not "permissions" in body:
            return req_session.generate_error_response(400, "Missing permissions to add")
        gsuite_action = actions.AddOrUpdatePermisssionForResource(req_session.get_auth_token(), body["permissions"],
                                                                req_session.get_req_param('user_email'),
                                                                req_session.get_req_param('initiated_by_email'),
                                                                req_session.get_req_param('datasource_id'))
        updated_permissions = gsuite_action.add_permissions()
        return req_session.generate_sqlalchemy_response(200, updated_permissions)

    def delete(self):
        req_session = RequestSession(request)
        req_error = req_session.validate_authorized_request(True, ['user_email', 'initiated_by_email', 'datasource_id'])
        if req_error:
            return req_error
        body = req_session.get_body()
        if not "permissions" in body:
            return req_session.generate_error_response(400, "Missing permissions to delete")
        gsuite_action = actions.AddOrUpdatePermisssionForResource(req_session.get_auth_token(), body["permissions"],
                                                                req_session.get_req_param('user_email'),
                                                                req_session.get_req_param('initiated_by_email'),
                                                                req_session.get_req_param('datasource_id'))
        updated_permissions = gsuite_action.delete_permissions()
        return req_session.generate_sqlalchemy_response(200, updated_permissions)

    def put(self):
        req_session = RequestSession(request)
        req_error = req_session.validate_authorized_request(True, ['user_email', 'initiated_by_email', 'datasource_id'])
        if req_error:
            return req_error
        body = req_session.get_body()
        if not "permissions" in body:
            return req_session.generate_error_response(400, "Missing permissions to update")
        gsuite_action = actions.AddOrUpdatePermisssionForResource(req_session.get_auth_token(), body["permissions"],
                                                                req_session.get_req_param('user_email'),
                                                                req_session.get_req_param('initiated_by_email'),
                                                                req_session.get_req_param('datasource_id'))

        updated_permissions = gsuite_action.update_permissions()
        return req_session.generate_sqlalchemy_response(200, updated_permissions)


