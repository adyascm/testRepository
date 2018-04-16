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
        permissions = body["permissions"]
        gsuite_action = actions.AddOrUpdatePermisssionForResource(req_session.get_auth_token(), permissions,
                                                                req_session.get_req_param('user_email'),
                                                                req_session.get_req_param('initiated_by_email'),
                                                                req_session.get_req_param('datasource_id'))
        updated_permissions = gsuite_action.add_permissions()
        exceptions = gsuite_action.get_exception_messages()
        if len(exceptions) > 0:
            if len(permissions) == len(exceptions):
                return req_session.generate_error_response(500, "Action failed - {}".format(exceptions[0]))
            else:
                return req_session.generate_error_response(500, "Action partially executed")
        else:
            return req_session.generate_success_response(200, "Action completed successfully")

    def delete(self):
        req_session = RequestSession(request)
        req_error = req_session.validate_authorized_request(True, ['user_email', 'initiated_by_email', 'datasource_id'])
        if req_error:
            return req_error
        body = req_session.get_body()
        if not "permissions" in body:
            return req_session.generate_error_response(400, "Missing permissions to delete")
        permissions = body["permissions"]
        gsuite_action = actions.AddOrUpdatePermisssionForResource(req_session.get_auth_token(), permissions,
                                                                req_session.get_req_param('user_email'),
                                                                req_session.get_req_param('initiated_by_email'),
                                                                req_session.get_req_param('datasource_id'))
        updated_permissions = gsuite_action.delete_permissions()
        exceptions = gsuite_action.get_exception_messages()
        if len(exceptions) > 0:
            if len(permissions) == len(exceptions):
                return req_session.generate_error_response(500, "Action failed - {}".format(exceptions[0]))
            else:
                return req_session.generate_error_response(500, "Action partially executed")
        else:
            return req_session.generate_success_response(200, "Action completed successfully")

    def put(self):
        req_session = RequestSession(request)
        req_error = req_session.validate_authorized_request(True, ['user_email', 'initiated_by_email', 'datasource_id'])
        if req_error:
            return req_error
        body = req_session.get_body()
        if not "permissions" in body:
            return req_session.generate_error_response(400, "Missing permissions to update")
        permissions = body["permissions"]
        gsuite_action = actions.AddOrUpdatePermisssionForResource(req_session.get_auth_token(), permissions,
                                                                req_session.get_req_param('user_email'),
                                                                req_session.get_req_param('initiated_by_email'),
                                                                req_session.get_req_param('datasource_id'))

        updated_permissions = gsuite_action.update_permissions()
        exceptions = gsuite_action.get_exception_messages()
        if len(exceptions) > 0:
            if len(permissions) == len(exceptions):
                return req_session.generate_error_response(500, "Action failed - {}".format(exceptions[0]))
            else:
                return req_session.generate_error_response(500, "Action partially executed")
        else:
            return req_session.generate_success_response(200, "Action completed successfully")


