from flask_restful import Resource, request
from adya.common.utils.request_session import RequestSession
from adya.core.controllers import domain_controller


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
        
        try:
            datasource = domain_controller.create_datasource(req_session.get_auth_token(), req_session.get_body())
        except Exception as ex:
            return req_session.generate_error_response(400, ex.message)
            
        return req_session.generate_sqlalchemy_response(201, datasource)

    def delete(self):
        req_session = RequestSession(request)
        req_error = req_session.validate_authorized_request(True, ["datasourceId"])
        if req_error:
            return req_error
        
        domain_controller.delete_datasource(req_session.get_auth_token(), req_session.get_req_param("datasourceId"))
        return req_session.generate_response(202)

class asyncdatasourcedelete(Resource):
    def delete(self):
        req_session = RequestSession(request)
        req_error = req_session.validate_authorized_request(True, ["datasourceId"])
        if req_error:
            return req_error
        
        domain_controller.async_delete_datasource(req_session.get_auth_token(), req_session.get_req_param("datasourceId"))
        return req_session.generate_response(200)


class TrustedPartners(Resource):
    def post(self):
        req_session = RequestSession(request)
        req_error = req_session.validate_authorized_request()
        if req_error:
            return req_error

        trusted_partners = domain_controller.create_trusted_entities_for_a_domain(req_session.get_auth_token(), req_session.get_body())
        return req_session.generate_sqlalchemy_response(201, trusted_partners)

    def get(self):
        req_session = RequestSession(request)
        req_error = req_session.validate_authorized_request(True, ["domainId"])
        if req_error:
            return req_error

        trusted_partners = domain_controller.get_all_trusted_entities(req_session.get_req_param("domainId"))
        return req_session.generate_sqlalchemy_response(200, trusted_partners)


    

