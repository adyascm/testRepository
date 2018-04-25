from adya.core.controllers import resource_controller
from flask_restful import Resource, reqparse, request
from adya.common.utils import utils
from adya.common.utils.request_session import RequestSession

class GetResources(Resource):
    # def post(Resource):
    #     req_session = RequestSession(request)
    #     req_error = req_session.validate_authorized_request()
    #     if req_error:
    #         return req_error
    #     auth_token = req_session.get_auth_token()

    #     payload = req_session.get_body()
    #     parentlist = payload.get("parentList")
    #     parentId = payload.get("parentId")
    #     resource_list = resource_controller.get_resource_tree(auth_token,parentId,parentlist)
    #     return req_session.generate_sqlalchemy_response(200, resource_list)

    def get(Resource):
        req_session = RequestSession(request)
        req_error = req_session.validate_authorized_request(optional_params=["prefix","pageNumber","pageSize"])
        if req_error:
            return req_error
        auth_token = req_session.get_auth_token()
        page_number = req_session.get_req_param("pageNumber")
        page_size= req_session.get_req_param("pageSize")
        resource_list = resource_controller.get_resources(auth_token,page_number,page_size,None, "", "", req_session.get_req_param("prefix"))
        return req_session.generate_sqlalchemy_response(200, resource_list)

    def post(Resource):
        req_session = RequestSession(request)
        req_error = req_session.validate_authorized_request(optional_params=["pageNumber","pageSize"])
        if req_error:
            return req_error
        auth_token = req_session.get_auth_token()

        payload = req_session.get_body()
        user_emails = payload.get("userEmails")
        exposure_type = payload.get("exposureType")
        resource_type = payload.get("resourceType")
        page_number = payload.get("pageNumber")
        page_size = payload.get("pageSize")
        owner_email_id = payload.get("ownerEmailId")
        parent_folder = payload.get("parentFolder")
        selected_date = payload.get("selectedDate")
        search_prefix = payload.get("prefix")
        sort_column_name = payload.get("columnName")
        sort_type = payload.get("sortType")
        resource_list = resource_controller.get_resources(auth_token,page_number,page_size, user_emails, exposure_type, resource_type, search_prefix, owner_email_id, parent_folder, selected_date, sort_column_name, sort_type)
        return req_session.generate_sqlalchemy_response(200, resource_list)