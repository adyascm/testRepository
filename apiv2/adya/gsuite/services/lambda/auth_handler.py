from __future__ import print_function
import json

from adya.datasources.google import auth
from adya.controllers import auth_controller
from adya.common.request_session import RequestSession


def google_oauth_request(event, context):
    req_session = RequestSession(event)
    req_error = req_session.validate_authorized_request(False, [], ['scope'])
    if req_error:
        return req_error

    url = auth.oauth_request(req_session.get_req_param('scope'))
    return req_session.generate_redirect_response(url)


def google_oauth_callback(event, context):
    req_session = RequestSession(event)
    req_error = req_session.validate_authorized_request(False, [], ['scope', 'code','state','error'])
    if req_error:
        return req_error

    url = auth.oauth_callback(req_session.get_req_param(
        'code'), req_session.get_req_param('scope'),req_session.get_req_param('state'), req_session.get_req_param('error'))
    if not url:
        req_session.generate_error_response(401, "Not authenticated")
    else:
        return req_session.generate_redirect_response(url)


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
