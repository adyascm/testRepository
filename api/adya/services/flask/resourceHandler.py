from adya.controllers import resourceController
from flask_restful import Resource, reqparse, request
import json
class GetResources(Resource):
    def get(Resource):
        auth_token = request.headers.get('Authorization')
        if not auth_token:
            return {'message': 'Missing auth token'}, 400
        parent_id = request.args.get("parentId")
        resource_tree = resourceController.get_resource_tree(auth_token,parent_id)
        return resource_tree, 200 
    def post(Resource):
        auth_token = request.headers.get('Authorization')
        if not auth_token:
            return {'message': 'Missing auth token'}, 400
        payload = json.loads(request.data)
        parentlist = payload.get("parentList")
        resource_tree = resourceController.get_resource_tree(auth_token,parent_id)
        return resource_tree, 200 