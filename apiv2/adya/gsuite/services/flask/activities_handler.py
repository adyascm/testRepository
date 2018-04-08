from flask_restful import Resource, request
from adya.datasources.google import activities

from adya.common.request_session import RequestSession
import json


class get_activities_for_user(Resource):
    def get(self):
        req_session = RequestSession(request)
        req_error = req_session.validate_authorized_request(mandatory_params=["user_email"])
        if req_error:
            return req_error

        auth_token = req_session.get_auth_token()

        user_email = req_session.get_req_param('user_email')
        response = activities.get_activities_for_user(auth_token, user_email, None)
        return req_session.generate_response(200, response)
