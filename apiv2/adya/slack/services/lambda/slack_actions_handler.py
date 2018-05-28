from sqlalchemy import and_

from adya.common.constants import action_constants
from adya.common.db.connection import db_connection
from adya.common.db.models import AuditLog
from adya.common.utils.request_session import RequestSession
from adya.slack import slack_actions


def delete_permissions_action(event, context):
    req_session = RequestSession(event)
    req_error = req_session.validate_authorized_request(True,
                                                        ['user_email', 'initiated_by_email', 'datasource_id', 'log_id'])
    if req_error:
        return req_error
    body = req_session.get_body()
    if not "permissions" in body:
        return req_session.generate_error_response(400, "Missing permissions to delete")
    permissions = body["permissions"]
    slack_action = slack_actions.Actions(req_session.get_req_param('datasource_id'), permissions,
                                         req_session.get_req_param('initiated_by_email'))
    deleted_File = slack_action.delete_public_and_external_sharing_for_file()
    exceptions = slack_action.get_exception_messages()

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
    current_log = db_session.query(AuditLog).filter(
        and_(AuditLog.log_id == log_id, AuditLog.status != action_constants.ActionStatus.FAILED)).first()
    if current_log:
        current_log.status = log_status
        current_log.message = status_message
        db_connection().commit()
    return req_session.generate_success_response(status_code, status_message)

