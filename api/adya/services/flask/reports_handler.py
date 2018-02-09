from flask_restful import Resource, request
from adya.controllers import reports_controller
from adya.common.request_session import RequestSession


class dashboard_widget(Resource):
    def get(self):
        req_session = RequestSession(request)
        req_error = req_session.validate_authorized_request(True, ['widgetId'])
        if req_error:
            return req_error
            
        data = reports_controller.get_widget_data(req_session.get_auth_token(), req_session.get_req_param('widgetId'))
        return req_session.generate_sqlalchemy_response(200, data)


class scheduled_report(Resource):
    def post(self):
        req_session = RequestSession(request)
        req_error = req_session.validate_authorized_request()
        if req_error:
            return req_error

        report = reports_controller.create_report(req_session.get_auth_token(),req_session.get_body())
        return req_session.generate_sqlalchemy_response(201, report)

