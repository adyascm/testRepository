from flask_restful import Resource,request
from adya.controllers import domain_controller, actions_controller
from adya.common.request_session import RequestSession
import json
from adya.common.response_messages import Logger


class get_all_actions(Resource):
    def get(self):
        req_session = RequestSession(request)
        req_error = req_session.validate_authorized_request()
        if req_error:
            return req_error

        auth_token = req_session.get_auth_token()
        
        actions = actions_controller.get_actions()
        return req_session.generate_sqlalchemy_response(200, actions)


class initiate_action(Resource):
    def post(self):
        req_session = RequestSession(request)
        req_error = req_session.validate_authorized_request()
        if req_error:
            return req_error

        auth_token = req_session.get_auth_token()
        data_source = domain_controller.get_datasource(auth_token, None)
        domain_id = data_source[0].domain_id
        datasource_id = data_source[0].datasource_id

        action_payload = req_session.get_body()

        Logger().info("Initiating action using payload: " + str(action_payload) + "on domain: " + str(domain_id) + " and datasource_id: " + str(datasource_id))
        response = actions_controller.initiate_action(auth_token, domain_id, datasource_id, action_payload)
        return req_session.generate_response(response.response_code, response.get_response_body())
