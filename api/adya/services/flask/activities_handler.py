from flask_restful import Resource, request
from adya.datasources.google import activities
from adya.controllers import domain_controller
from adya.common.request_session import RequestSession
import json


class get_activities_for_user(Resource):
    def get(self):
        req_session = RequestSession(request)
        req_error = req_session.validate_authorized_request(mandatory_params=["user_email"])
        if req_error:
            return req_error

        auth_token = req_session.get_auth_token()
        print auth_token
        data_source = domain_controller.get_datasource(auth_token, None)

        print data_source
        domain_id = data_source[0].domain_id
        datasource_id = data_source[0].datasource_id

        user_email = req_session.get_req_param('user_email')

        print "Getting user activities for user: ", user_email, "on domain: ", domain_id, " and datasource_id: ", datasource_id
        response = activities.get_activities_for_user(auth_token, domain_id, datasource_id, user_email, None)
        response_json = json.dumps(response)
        print response_json
        return req_session.generate_response(202, payload=response_json)
