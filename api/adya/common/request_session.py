from flask_restful import request
import json

from adya.db.models import AlchemyEncoder

class RequestSession():
    def __init__(self, req):
        self.req = req
        self.auth_token = None
        self.params = {}
        self.isLocal = True

    def validate_authorized_request(self, validateAuth=True, mandatory_params=[], optional_params=[]):
        #Validate the flask request
        print "Dumping the request"
        print json.dumps(self.req)
        params_dict = {}
        try:
            ctx = self.req['requestContext']
            self.isLocal = False
        except Exception as ex:
            self.isLocal = True
        
        if self.isLocal is False:
            print("Request is understood as a lambda request")
            self.isLocal = False
            self.auth_token = self.req["headers"].get("Authorization")
            params_dict = self.req["queryStringParameters"]
        #Validate the lambda event object
        else:
            print("Request is understood as a flask request")
            self.auth_token = self.req.headers.get('Authorization')
            params_dict = self.req.args

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

    def get_auth_token(self):
        return self.auth_token

    def get_req_param(self, param):
        return self.params[param]

    def get_body(self):
        if self.isLocal:
            return self.req.get_json()
        else:
            if(self.req["body"]:
                return JSON.parse(self.req["body"])
            else:
                return {}

    def generate_error_response(self, http_code, message):
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
        json_string_payload = json.dumps(payload, cls=AlchemyEncoder)
        if self.isLocal:
            json_payload = json.loads(json_string_payload)
        else:
            json_payload = json_string_payload
        return self.generate_response(http_code, json_payload)

    def generate_response(self, http_code, payload = None):
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
