from adya.controllers import resourceController
from flask_restful import Resource, reqparse, request
from adya.common import utils
from adya.common.request_session import RequestSession

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
    #     resource_list = resourceController.get_resource_tree(auth_token,parentId,parentlist)
    #     return req_session.generate_sqlalchemy_response(200, resource_list)

    def get(Resource):
        req_session = RequestSession(request)
        req_error = req_session.validate_authorized_request(optional_params=["prefix"])
        if req_error:
            return req_error
        auth_token = req_session.get_auth_token()

        resource_list = resourceController.get_resources(auth_token, None, "", "", req_session.get_req_param("prefix"))
        return req_session.generate_sqlalchemy_response(200, resource_list)

    def post(Resource):
        req_session = RequestSession(request)
        req_error = req_session.validate_authorized_request()
        if req_error:
            return req_error
        auth_token = req_session.get_auth_token()

        payload = req_session.get_body()
        user_emails = payload.get("userEmails")
        exposure_type = payload.get("exposureType")
        resource_type = payload.get("resourceType")
        resource_list = resourceController.get_resources(auth_token,user_emails,exposure_type,resource_type)
        return req_session.generate_sqlalchemy_response(200, resource_list)