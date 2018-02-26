import urlparse

from flask_restful import Resource, reqparse, request
from adya.controllers import auditlog_controller
from adya.common.request_session import RequestSession

def get_audit_log(event,context):
    req_session = RequestSession(event)
    req_error = req_session.validate_authorized_request(True)
    if req_error:
        return req_error
    auth_token = req_session.get_auth_token()
    audit_log_list = auditlog_controller.get_audit_log(auth_token)
    return req_session.generate_sqlalchemy_response(200, audit_log_list)