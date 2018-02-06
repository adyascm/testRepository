
from flask_restful import Resource, reqparse, request
from adya.controllers import domainDataController
import json

class UserGroupTree(Resource):
    def get(self):
        auth_token = request.headers.get('Authorization')
        if not auth_token:
            return {'message': 'Missing auth token'}, 400
        datasources = domainDataController.get_user_group_tree(auth_token)
        return datasources, 200
