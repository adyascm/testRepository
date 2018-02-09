from flask_restful import Resource, request
from adya.common.request_session import RequestSession
from adya.controllers import domain_controller


class datasource(Resource):
    def get(self):
        req_session = RequestSession(request)
        req_error = req_session.validate_authorized_request()
        if req_error:
            return req_error

        datasources = domain_controller.get_datasource(req_session.get_auth_token(), None)
        return req_session.generate_sqlalchemy_response(200, datasources)

    def post(self):
        req_session = RequestSession(request)
        req_error = req_session.validate_authorized_request()
        if req_error:
            return req_error
        
        datasource = domain_controller.create_datasource(req_session.get_auth_token(), req_session.get_body())
        return req_session.generate_sqlalchemy_response(201, datasource)


