from flask_restful import Resource,request
from adya.controllers import domain_controller, actions_controller
from adya.common.request_session import RequestSession
import json


def get_all_actions(event, context):
    req_session = RequestSession(event)
    req_error = req_session.validate_authorized_request()
    if req_error:
        return req_error

    auth_token = req_session.get_auth_token()
    
    data_source = domain_controller.get_datasource(auth_token, None)
    if not data_source:
        return
    datasource_type = data_source[0].datasource_type

    print "Getting all actions for datasource_type: ", datasource_type
    response = actions_controller.get_actions()
    return req_session.generate_sqlalchemy_response(202, response)


def initiate_action(event, context):
    req_session = RequestSession(event)
    req_error = req_session.validate_authorized_request()
    if req_error:
        return req_error

    auth_token = req_session.get_auth_token()
    print auth_token
    data_source = domain_controller.get_datasource(auth_token, None)

    print data_source
    domain_id = data_source[0].domain_id
    datasource_id = data_source[0].datasource_id

    action_payload = req_session.get_body()

    print "Initiating action using payload: ", action_payload, "on domain: ", domain_id, " and datasource_id: ", datasource_id
    response = actions_controller.initiate_action(auth_token, domain_id, datasource_id, action_payload)
    print response

    return req_session.generate_response(202, response)
