import json

from adya.common.constants import urls
from adya.core.controllers import reports_controller, directory_controller, resource_controller, domain_controller
from adya.common.utils import aws_utils
from adya.common.utils.request_session import RequestSession
from adya.common.utils.response_messages import Logger

def get_resources(event, context):
    req_session = RequestSession(event)
    req_error = req_session.validate_authorized_request(optional_params=["pageNumber", "pageLimit", "sortColumn", "sortType"])
    if req_error:
        return req_error
    auth_token = req_session.get_auth_token()

    resource_list = resource_controller.get_resources(auth_token, req_session.get_body(), req_session.get_req_param("pageNumber"), req_session.get_req_param("pageLimit"), req_session.get_req_param("sortColumn"), 
                        req_session.get_req_param("sortType"))
    return req_session.generate_sqlalchemy_response(200, resource_list)


def export_to_csv(event, context):
    req_session = RequestSession(event)
    req_error = req_session.validate_authorized_request(optional_params=["isAsync"])
    if req_error:
        return req_error
    
    resource_controller.export_to_csv(req_session.get_auth_token(), req_session.get_req_param("isAsync"), req_session.get_body())
    return req_session.generate_response(202)
