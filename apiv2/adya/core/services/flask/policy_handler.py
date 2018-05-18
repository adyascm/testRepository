from flask_restful import Resource, request

from adya.common.utils.request_session import RequestSession
from adya.core.controllers import policy_controller


class Policy(Resource):
    def get(self):
        req_session = RequestSession(request)
        req_error = req_session.validate_authorized_request()
        if req_error:
            return req_error
        policies = policy_controller.get_policies(req_session.get_auth_token())
        return req_session.generate_sqlalchemy_response(200, policies)

    def post(self):
        req_session = RequestSession(request)
        req_error = req_session.validate_authorized_request()
        if req_error:
            return req_error
        policy_obj = policy_controller.create_policy(req_session.get_auth_token(), req_session.get_body())
        return req_session.generate_sqlalchemy_response(201, policy_obj)

    def delete(self):
        req_session = RequestSession(request)
        req_error = req_session.validate_authorized_request(True, ['policyId'])
        if req_error:
            return req_error
        policy_controller.delete_policy(req_session.get_req_param('policyId'))
        return req_session.generate_response(200)

    def put(self):
         req_session = RequestSession(request)
         req_error = req_session.validate_authorized_request(True, ['policyId'])
         if req_error:
             return req_error
         policy_obj = policy_controller.update_policy(req_session.get_auth_token(), req_session.get_req_param('policyId'),
                                                      req_session.get_body())
         return req_session.generate_sqlalchemy_response(201, policy_obj)


class PolicyValidator(Resource):
    def post(self):
        req_session = RequestSession(request)
        req_error = req_session.validate_authorized_request(True, ['dataSourceId'])
        if req_error:
            return req_error
        policy_controller.validate(req_session.get_auth_token(), req_session.get_req_param('dataSourceId'), req_session.get_body())
        return req_session.generate_response(200)

class DefaultPoliciesCreator(Resource):
    def post(self):
        req_session = RequestSession(request)
        req_error = req_session.validate_authorized_request(True, ['dataSourceId'])
        if req_error:
            return req_error
        policy_controller.create_default_policies(req_session.get_auth_token(), req_session.get_req_param('dataSourceId'))
        return req_session.generate_response(200)
    