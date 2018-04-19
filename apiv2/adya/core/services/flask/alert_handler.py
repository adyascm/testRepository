from flask_restful import Resource, request

from adya.common.utils.request_session import RequestSession
from adya.core.controllers import alert_controller

class Alert(Resource):
    def get(self):
        req_session = RequestSession(request)
        req_error = req_session.validate_authorized_request(optional_params=["fetchViolationCount"])
        if req_error:
            return req_error
        fetch_violation_count = req_session.get_req_param("fetchViolationCount")
        
        if fetch_violation_count:
            open_alerts_count = alert_controller.fetch_open_alerts(req_session.get_auth_token())
            return req_session.generate_sqlalchemy_response(200, open_alerts_count)
        
        alerts = alert_controller.get_alerts(req_session.get_auth_token())
        return req_session.generate_sqlalchemy_response(200, alerts)
    
    def post(self):
        req_session = RequestSession(request)
        req_error = req_session.validate_authorized_request()
        if req_error:
            return req_error
        alerts = alert_controller.create_alerts(req_session.get_auth_token, req_session.get_body)
        return req_session.generate_sqlalchemy_response(201,alerts)