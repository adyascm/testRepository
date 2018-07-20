import json

from adya.common.constants import urls
from adya.core.controllers import reports_controller, directory_controller, resource_controller, domain_controller
from adya.common.utils import aws_utils
from adya.common.utils.request_session import RequestSession
from adya.common.utils.response_messages import Logger

def get_user_stats(event, context):
    req_session = RequestSession(event)
    req_error = req_session.validate_authorized_request(True)
    if req_error:
        return req_error
    stats = directory_controller.get_user_stats(req_session.get_auth_token())
    return req_session.generate_sqlalchemy_response(200, stats)

def get_users_list(event, context):
    req_session = RequestSession(event)
    req_error = req_session.validate_authorized_request(optional_params=["full_name", "email", "member_type", "datasource_id", "sort_column", "sort_order", "is_admin", "type", "page_number"])
    if req_error:
        return req_error
    users = directory_controller.get_users_list(req_session.get_auth_token(), req_session.get_req_param("full_name"), req_session.get_req_param("email"), req_session.get_req_param("member_type"), req_session.get_req_param("datasource_id"), req_session.get_req_param("sort_column"), req_session.get_req_param("sort_order"), req_session.get_req_param("is_admin"), req_session.get_req_param("type"), req_session.get_req_param("page_number"))
    return req_session.generate_sqlalchemy_response(200, users)

def get_group_members(event, context):
    req_session = RequestSession(event)
    req_error = req_session.validate_authorized_request(True, optional_params=["groupEmail", "datasourceId"])
    if req_error:
        return req_error
    auth_token = req_session.get_auth_token()
    group_email = req_session.get_req_param('groupEmail')
    datasource_id = req_session.get_req_param('datasourceId')

    group_members = directory_controller.get_group_members(auth_token, group_email, datasource_id)
    return req_session.generate_sqlalchemy_response(200, group_members)

def export_to_csv(event, context):
    req_session = RequestSession(event)
    req_error = req_session.validate_authorized_request()
    if req_error:
        return req_error

    response = directory_controller.export_to_csv(req_session.get_auth_token(), req_session.get_body())
    return req_session.generate_sqlalchemy_response(response.response_code, response.get_response_body())
