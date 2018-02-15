from flask_restful import Resource, request
from adya.controllers import reports_controller
from adya.common.request_session import RequestSession
from adya.realtimeframework.ortc_conn import RealtimeConnection


class DashboardWidget(Resource):
    def get(self):
        req_session = RequestSession(request)
        req_error = req_session.validate_authorized_request(True, ['widgetId'])
        if req_error:
            return req_error

        data = reports_controller.get_widget_data(req_session.get_auth_token(), req_session.get_req_param('widgetId'))
        return req_session.generate_sqlalchemy_response(200, data)


class ScheduledReport(Resource):
    def post(self):
        req_session = RequestSession(request)
        req_error = req_session.validate_authorized_request()
        if req_error:
            return req_error
        frequency = req_session.get_body()['frequency']
        name = req_session.get_body()['name']
        print("body ", frequency)
        report = reports_controller.create_report(req_session.get_auth_token(), req_session.get_body())
        # cloudwatch_event.create_cloudwatch_event(name, frequency)
        return req_session.generate_sqlalchemy_response(201, report)

    def get(self):
        req_session = RequestSession(request)
        req_error = req_session.validate_authorized_request()
        if req_error:
            return req_error

        reports = reports_controller.get_reports(req_session.get_auth_token())
        return req_session.generate_sqlalchemy_response(200, reports)

    def delete(self):
        req_session = RequestSession(request)
        req_error = req_session.validate_authorized_request(True, ['reportId'])
        if req_error:
            return req_error
        reports_controller.delete_report(req_session.get_auth_token(), req_session.get_req_param('reportId'))
        return req_session.generate_response(200)


class RunReport(Resource):
    def get(self):
        req_session = RequestSession(request)
        req_error = req_session.validate_authorized_request(True, ['reportId'])
        if req_error:
            return req_error

        run_report_data = reports_controller.run_report(req_session.get_auth_token(), req_session.get_req_param('reportId'))

        return req_session.generate_sqlalchemy_response(200, run_report_data)

