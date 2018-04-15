from flask_restful import request
import json
from adya.common.constants import constants

from adya.common.db.models import alchemy_encoder
from adya.common.db.connection import db_connection
from adya.common.utils.response_messages import Logger

class RequestSession():
    def __init__(self, req):
        self.req = req if req else {}
        self.auth_token = None
        self.params = {}
        self.headers = {}
        self.isLocal = True

    def validate_authorized_request(self, validateAuth=True, mandatory_params=[], optional_params=[], headers=[]):
        # Validate the flask request
        params_dict = {}
        self.isLocal = True

        headers_dict = {}
        if constants.DEPLOYMENT_ENV == "local":
            headers_dict = self.req.headers
            params_dict = self.req.args
        else:
            Logger().info("Dumping the event object - " + json.dumps(self.req))
            self.isLocal = False
            headers_dict = self.req
            if "headers" in self.req:
                headers_dict = self.req["headers"]

            params_dict = self.req
            if "queryStringParameters" in self.req:
                params_dict = self.req["queryStringParameters"] or {}

        self.auth_token = headers_dict.get("Authorization")
        if validateAuth and not self.auth_token:
            return self.generate_error_response(401, "Not authenticated")
        for param in mandatory_params:
            value = params_dict.get(param)
            if not value:
                return self.generate_error_response(400, "Missing request fields - " + param)
            else:
                self.params[param] = value
        for param in optional_params:
            self.params[param] = params_dict.get(param)

        for header in headers:
            self.headers[header] = headers_dict.get(header)

    def get_auth_token(self):
        return self.auth_token

    def get_req_param(self, param):
        return self.params[param]

    def get_req_header(self, header):
        return self.headers[header]

    def get_body(self):
        if self.isLocal:
            return self.req.get_json()
        else:
            if "body" in self.req:
                if not self.req["body"]:
                    return json.loads("{}")
                return json.loads(self.req["body"])
            else:
                return self.req

    def generate_error_response(self, http_code, message):
        return self.generate_response(http_code, {'message': message})

    def generate_success_response(self, http_code, message):
        return self.generate_response(http_code, {'message': message})

    def generate_redirect_response(self, location):
        if self.isLocal:
            return {'location': location}, 301, {'location': location}
        else:
            return {
                "statusCode": 301,
                "headers": {"location": location}
            }

    def generate_sqlalchemy_response(self, http_code, payload):
        json_string_payload = json.dumps(payload, cls=alchemy_encoder())
        if self.isLocal:
            json_payload = json.loads(json_string_payload)
        else:
            json_payload = json_string_payload
        return self.generate_response(http_code, json_payload)

    def generate_response(self, http_code, payload=None):
        db_connection().close_connection()
        if self.isLocal:
            return payload, http_code
        else:
            return {
                "statusCode": http_code,
                "body": payload,
                "headers": {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Credentials": True
                },
            }
