import json
from flask_restful import request, Resource
from adya.gsuite import actions
from adya.common.utils.request_session import RequestSession
from adya.common.db.models import AuditLog
from adya.common.db.connection import db_connection
from sqlalchemy import and_
from adya.common.constants import action_constants

class Actions(Resource):
    def post(self):
        req_session = RequestSession(request)
        req_error = req_session.validate_authorized_request(True, ['user_email','initiated_by_email', 'datasource_id','log_id'])
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
        log_status = action_constants.ActionStatus.SUCCESS
        status_code = 200
        status_message = "Action completed successfully"
        if len(exceptions) > 0:
            log_status = action_constants.ActionStatus.FAILED
            status_code = 500
            if len(permissions) == len(exceptions):
                status_message = "Action failed - {}".format(exceptions[0])
            else:
                status_message = "Action completed successfully"

        log_id = req_session.get_req_param('log_id')
        db_session = db_connection().get_session()
        current_log = db_session.query(AuditLog).filter(and_(AuditLog.log_id == log_id, AuditLog.status != action_constants.ActionStatus.FAILED)).first()
        if current_log:
            current_log.status = log_status
            current_log.message = status_message
            db_connection().commit()
        return req_session.generate_success_response(status_code, status_message)        

    def delete(self):
        req_session = RequestSession(request)
        req_error = req_session.validate_authorized_request(True, ['user_email', 'initiated_by_email', 'datasource_id', 'log_id'])
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
        
        log_status = action_constants.ActionStatus.SUCCESS
        status_code = 200
        status_message = "Action completed successfully"
        if len(exceptions) > 0:
            log_status = action_constants.ActionStatus.FAILED
            status_code = 500
            if len(permissions) == len(exceptions):
                status_message = "Action failed - {}".format(exceptions[0])
            else:
                status_message = "Action partially executed"

        log_id = req_session.get_req_param('log_id')
        db_session = db_connection().get_session()
        current_log = db_session.query(AuditLog).filter(and_(AuditLog.log_id == log_id, AuditLog.status != action_constants.ActionStatus.FAILED)).first()
        if current_log:
            current_log.status = log_status
            current_log.message = status_message
            db_connection().commit()
        return req_session.generate_success_response(status_code, status_message)

    def put(self):
        req_session = RequestSession(request)
        req_error = req_session.validate_authorized_request(True, ['user_email', 'initiated_by_email', 'datasource_id','log_id'])
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
        log_status = action_constants.ActionStatus.SUCCESS
        status_code = 200
        status_message = "Action completed successfully"

        if len(exceptions) > 0:
            log_status = action_constants.ActionStatus.FAILED
            status_code = 500
            if len(permissions) == len(exceptions):
                status_message = "Action failed - {}".format(exceptions[0])
            else:
                status_message = "Action partially executed"
        
        log_id = req_session.get_req_param('log_id')
        db_session = db_connection().get_session()
        current_log = db_session.query(AuditLog).filter(and_(AuditLog.log_id == log_id, AuditLog.status != action_constants.ActionStatus.FAILED)).first()
        if current_log:
            current_log.status = log_status
            current_log.message = status_message
            db_connection().commit()
        return req_session.generate_success_response(status_code, status_message)


