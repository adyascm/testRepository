from adya.controllers import resourceController
from flask_restful import Resource, reqparse, request
import json
class GetResources(Resource):
    def post(Resource):
        auth_token = request.headers.get('Authorization')
        if not auth_token:
            return {'message': 'Missing auth token'}, 400
        payload = json.loads(request.data)
        parentlist = payload.get("parentList")
        parentId = payload.get("parentId")
        resource_list = resourceController.get_resource_tree(auth_token,parentId,parentlist)
        return resource_list, 200 