from __future__ import print_function
import json

from adya.core.controllers import auth_controller
from adya.common.utils.request_session import RequestSession

def current_user(event, context):
    req_session = RequestSession(event)
    req_error = req_session.validate_authorized_request()
    if req_error:
        return req_error

    user_session = auth_controller.get_user_session(
        req_session.get_auth_token())

    if not user_session:
        return req_session.generate_error_response(401, "User session not found")
    else:
        return req_session.generate_sqlalchemy_response(200, user_session)
