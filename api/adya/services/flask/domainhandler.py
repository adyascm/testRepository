from flask import json
from flask_restful import Resource, reqparse, request

from adya.controllers import domain_controller


class datasource(Resource):
    def get(self):
        auth_token = request.headers.get('Authorization')
        if not auth_token:
            return {'message': 'Missing auth token'}, 400
        datasources = domain_controller.get_datasource(auth_token)

        return datasources, 200

    def post(self):
        auth_token = request.headers.get('Authorization')
        if not auth_token:
            return {'message': 'Missing auth token'}, 400
        payload = request.get_json()
        datasource = domain_controller.create_datasource(auth_token, payload)

        return datasource, 201


