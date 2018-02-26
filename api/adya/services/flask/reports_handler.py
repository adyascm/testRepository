import uuid

from flask_restful import Resource, request

from adya.common import aws_utils
from adya.controllers import reports_controller, domain_controller
from adya.common.request_session import RequestSession


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
        report = reports_controller.create_report(req_session.get_auth_token(), req_session.get_body())

        frequency = report.frequency
        cloudwatch_eventname = report.name + "_" + report.report_id  #TODO: if someone changes the report_name
        # aws_utils.create_cloudwatch_event(cloudwatch_eventname, frequency, report.report_id)
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
        deleted_report = reports_controller.delete_report(req_session.get_auth_token(), req_session.get_req_param('reportId'))
        cloudwatch_eventname = deleted_report.name + "_" + deleted_report.report_id
        # aws_utils.delete_cloudwatch_event(cloudwatch_eventname)
        return req_session.generate_response(200)

    def put(self):
        req_session = RequestSession(request)
        req_error = req_session.validate_authorized_request()
        if req_error:
            return req_error
        update_record = reports_controller.update_report(req_session.get_auth_token(), req_session.get_body())

        # frequency = report.frequency
        # cloudwatch_eventname = report.name + "_" + report.report_id  # TODO: if someone changes the report_name
        # aws_utils.create_cloudwatch_event(cloudwatch_eventname, frequency, report.report_id)
        return req_session.generate_sqlalchemy_response(201, update_record)


class RunReport(Resource):
    def get(self):
        req_session = RequestSession(request)
        req_error = req_session.validate_authorized_request(True, ['reportId'])
        if req_error:
            return req_error

        auth_token = req_session.get_auth_token()
        data_source = domain_controller.get_datasource(auth_token, None)

        domain_id = data_source[0].domain_id
        datasource_id = data_source[0].datasource_id

        run_report_data, email_list, report_type, report_desc = reports_controller.run_report(domain_id, datasource_id, auth_token,
                                                        req_session.get_req_param('reportId'))

        print run_report_data

        return req_session.generate_sqlalchemy_response(200, run_report_data)

