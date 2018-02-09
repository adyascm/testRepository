from adya.controllers import resourceController
from flask_restful import Resource, reqparse, request
import json
from adya.common import utils

class GetResources(Resource):
    def post(Resource):
        req_session = RequestSession(request)
        req_error = req_session.validate_authorized_request()
        if req_error:
            return req_error
        auth_token = req_session.get_auth_token()

        payload = utils.get_json_object(request.data)
        parentlist = payload.get("parentList")
        parentId = payload.get("parentId")
        resource_list = resourceController.get_resource_tree(auth_token,parentId,parentlist)
        return req_session.generate_sqlalchemy_response(200, resource_list)