import json

from adya.common.constants import urls
from adya.core.controllers import reports_controller, directory_controller, resource_controller, domain_controller
from adya.common.utils import aws_utils
from adya.common.utils.request_session import RequestSession
from adya.common.utils.response_messages import Logger

def get_resources(event, context):
    req_session = RequestSession(event)
    req_error = req_session.validate_authorized_request(optional_params=["prefix","pageNumber","pageSize"])
    if req_error:
        return req_error
    auth_token = req_session.get_auth_token()
    page_number = req_session.get_req_param("pageNumber")
    page_size= req_session.get_req_param("pageSize")
    resource_list = resource_controller.get_resources(auth_token,page_number,page_size,None, "", "",
                                                        req_session.get_req_param("prefix"))
    return req_session.generate_sqlalchemy_response(200, resource_list)

def get_resource_tree_data(event, context):
    req_session = RequestSession(event)
    req_error = req_session.validate_authorized_request(optional_params=["pageNumber","pageSize", "datasourceId"])
    if req_error:
        return req_error
    auth_token = req_session.get_auth_token()

    payload = req_session.get_body()
    accessible_by = payload.get("accessibleBy")
    exposure_type = payload.get("exposureType")
    resource_type = payload.get("resourceType")
    page_number = payload.get("pageNumber")
    page_size = payload.get("pageSize")
    owner_email_id = payload.get("ownerEmailId")
    parent_folder = payload.get("parentFolder")
    selected_date = payload.get("selectedDate")
    search_prefix = payload.get("prefix")
    sort_column_name = payload.get("sortColumn")
    sort_type = payload.get("sortType")
    datasource_id = payload.get("datasourceId")
    source_type = payload.get("sourceType")
    resource_list = resource_controller.get_resources(auth_token,page_number,page_size, accessible_by, exposure_type,
                                                      resource_type, search_prefix, owner_email_id, parent_folder,
                                                      selected_date, sort_column_name, sort_type, datasource_id, source_type)
    return req_session.generate_sqlalchemy_response(200, resource_list)


def export_to_csv(event, context):
    req_session = RequestSession(event)
    req_error = req_session.validate_authorized_request()
    if req_error:
        return req_error
    
    url = resource_controller.export_to_csv(req_session.get_auth_token(), req_session.get_body())
    return req_session.generate_response(202, url)
