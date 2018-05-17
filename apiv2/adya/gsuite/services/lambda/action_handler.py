import json
from adya.common.utils.request_session import RequestSession
from adya.gsuite import actions
from adya.common.db.models import AuditLog
from adya.common.db.connection import db_connection
from sqlalchemy import and_
from adya.common.constants import constants, action_constants

def add_permissions_action(event, context):
    req_session = RequestSession(event)
    req_error = req_session.validate_authorized_request(True, ['user_email','initiated_by_email', 'datasource_id', 'log_id'])
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
        status_code = 500
        log_status = action_constants.ActionStatus.FAILED
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

def delete_permissions_action(event, context):
    req_session = RequestSession(event)
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
        status_code = 500
        log_status = action_constants.ActionStatus.FAILED
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


def update_permissions_action(event, context):
    req_session = RequestSession(event)
    req_error = req_session.validate_authorized_request(True, ['user_email', 'initiated_by_email', 'datasource_id', 'log_id'])
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
        status_code = 500
        log_status = action_constants.ActionStatus.FAILED
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
