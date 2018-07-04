from sqlalchemy import and_

from adya.common.constants import action_constants, constants
from adya.common.db.connection import db_connection
from adya.common.db.models import AuditLog
from adya.common.utils.request_session import RequestSession
from adya.slack.actions import slack_action_facade


def execute_slack_actions(event, context):
    req_session = RequestSession(event)
    req_error = req_session.validate_authorized_request(True)
    if req_error:
        return req_error
    body = req_session.get_body()

    response = slack_action_facade.execute_slack_actions(req_session.get_auth_token(), body)

    log_status = action_constants.ActionStatus.SUCCESS.value
    status_code = 200
    status_message = "Action completed successfully"

    if response['action_status'] == constants.ResponseType.ERROR.value:
        status_code = 404
        log_status = action_constants.ActionStatus.FAILED.value
        status_message = "Action failed"

    log_id = body['log_id']
    db_session = db_connection().get_session()
    current_log = db_session.query(AuditLog).filter(
        and_(AuditLog.log_id == log_id, AuditLog.status != action_constants.ActionStatus.FAILED.value)).first()
    if current_log:
        current_log.status = log_status
        current_log.message = status_message
        db_connection().commit()

    return req_session.generate_response(status_code, response)
