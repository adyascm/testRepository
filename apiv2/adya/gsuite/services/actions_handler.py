import json
from adya.common.utils.request_session import RequestSession
from adya.gsuite.actions import gsuite_action_facade
from adya.common.db.models import AuditLog
from adya.common.db.connection import db_connection
from sqlalchemy import and_
from adya.common.constants import constants, action_constants


def execute_gsuite_actions(event, context):
    req_session = RequestSession(event)
    req_error = req_session.validate_authorized_request(True)
    if req_error:
        return req_error
    response = gsuite_action_facade.execute_action(req_session.get_auth_token(), req_session.get_body())
    return req_session.generate_sqlalchemy_response(response.get_response_code(), response.get_response_body())