from __future__ import print_function
import json

from adya.controllers import domain_controller
from adya.common.request_session import RequestSession

def get_datasource(event, context):
    req_session = RequestSession(event)
    req_error = req_session.validate_authorized_request()
    if req_error:
        return req_error

    datasources = domain_controller.get_datasource(
        req_session.get_auth_token(), None)
    return req_session.generate_response(200, datasources)


def post_datasource(event, context):
    req_session = RequestSession(event)
    req_error = req_session.validate_authorized_request()
    if req_error:
        return req_error

    datasource = domain_controller.create_datasource(req_session.get_auth_token(), req_session.get_body())
    return req_session.generate_response(200, datasource)
