import json

from adya.common.constants import urls
from adya.core.controllers import reports_controller, directory_controller, resource_controller, domain_controller
from adya.common.utils import aws_utils
from adya.common.utils.request_session import RequestSession
from adya.common.utils.response_messages import Logger

def get_widget_data(event, context):
    req_session = RequestSession(event)
    req_error = req_session.validate_authorized_request(True, ['widgetId'])
    if req_error:
        return req_error

    data = reports_controller.get_widget_data(
        req_session.get_auth_token(), req_session.get_req_param('widgetId'))
    return req_session.generate_sqlalchemy_response(200, data)

def get_user_stats(event, context):
    req_session = RequestSession(event)
    req_error = req_session.validate_authorized_request(True)
    if req_error:
        return req_error
    stats = directory_controller.get_user_stats(req_session.get_auth_token())
    return req_session.generate_sqlalchemy_response(200, stats)

def get_users_list(event, context):
    req_session = RequestSession(event)
    req_error = req_session.validate_authorized_request(optional_params=["full_name", "email", "member_type", "datasource_id", "sort_column", "sort_order", "is_admin", "type", "page_number"])
    if req_error:
        return req_error
    users = directory_controller.get_users_list(req_session.get_auth_token(), req_session.get_req_param("full_name"), req_session.get_req_param("email"), req_session.get_req_param("member_type"), req_session.get_req_param("datasource_id"), req_session.get_req_param("sort_column"), req_session.get_req_param("sort_order"), req_session.get_req_param("is_admin"), req_session.get_req_param("type"), req_session.get_req_param("page_number"))
    return req_session.generate_sqlalchemy_response(200, users)

def get_group_members(event, context):
    req_session = RequestSession(event)
    req_error = req_session.validate_authorized_request(True, optional_params=["groupEmail", "datasourceId"])
    if req_error:
        return req_error
    auth_token = req_session.get_auth_token()
    group_email = req_session.get_req_param('groupEmail')
    datasource_id = req_session.get_req_param('datasourceId')

    group_members = directory_controller.get_group_members(auth_token, group_email, datasource_id)
    return req_session.generate_sqlalchemy_response(200, group_members)       

def get_scheduled_reports(event, context):
    req_session = RequestSession(event)
    req_error = req_session.validate_authorized_request()
    if req_error:
        return req_error

    reports = reports_controller.get_reports(req_session.get_auth_token())
    return req_session.generate_sqlalchemy_response(200, reports)


def post_scheduled_report(event, context):
    req_session = RequestSession(event)
    req_error = req_session.validate_authorized_request()
    if req_error:
        return req_error

    report = reports_controller.create_report(
        req_session.get_auth_token(), req_session.get_body())

    cron_expression = report.frequency
    report_id = report.report_id
    payload = {'report_id': report_id}
    function_name = aws_utils.get_lambda_name('get', urls.EXECUTE_SCHEDULED_REPORT)

    aws_utils.create_cloudwatch_event(report_id, cron_expression, function_name, payload)

    return req_session.generate_sqlalchemy_response(201, report)


def modify_scheduled_report(event, context):
    req_session = RequestSession(event)
    req_error = req_session.validate_authorized_request()
    if req_error:
        return req_error

    update_record = reports_controller.update_report(req_session.get_auth_token(), req_session.get_body())

    report_id = update_record['report_id']
    frequency = update_record['frequency']
    payload = {'report_id': report_id}
    function_name = aws_utils.get_lambda_name('get', urls.EXECUTE_SCHEDULED_REPORT)
    aws_utils.create_cloudwatch_event(report_id, frequency, function_name, payload)
    return req_session.generate_sqlalchemy_response(201, update_record)


def delete_scheduled_report(event, context):
    req_session = RequestSession(event)
    req_error = req_session.validate_authorized_request(True, ['reportId'])
    if req_error:
        return req_error
    deleted_report = reports_controller.delete_report(req_session.get_auth_token(),
                                                      req_session.get_req_param('reportId'))

    function_name = aws_utils.get_lambda_name('get', urls.EXECUTE_SCHEDULED_REPORT)
    aws_utils.delete_cloudwatch_event(deleted_report.report_id, function_name)
    return req_session.generate_response(200)


def run_scheduled_report(event, context):
    req_session = RequestSession(event)
    req_error = req_session.validate_authorized_request(True, ['reportId'])
    if req_error:
        return req_error

    auth_token = req_session.get_auth_token()

    run_report_data, email_list, report_type, report_desc, report_name = reports_controller.run_report(auth_token,
                                                                req_session.get_req_param('reportId'))
    return req_session.generate_sqlalchemy_response(200, run_report_data)


def execute_cron_report(event, context):
    Logger().info("execute_cron_report : event " + str(event))
    req_session = RequestSession(event)
    req_error = req_session.validate_authorized_request(False, ["report_id"])
    if req_error:
        return req_error

    if req_error:
        return req_error

    Logger().info("call generate_csv_report function ")
    Logger().info("report id " + str(req_session.get_req_param('report_id')))
    csv_records, email_list, report_desc, report_name = reports_controller.generate_csv_report(req_session.get_req_param('report_id'))

    if len(csv_records) > 0:
        Logger().info("call send_email_with_attachment function ")

        aws_utils.send_email_with_attachment(email_list, csv_records, report_desc, report_name)

    return req_session.generate_response(200)


def create_default_reports(event, context):
    req_session = RequestSession(event)
    req_error = req_session.validate_authorized_request(True, ['dataSourceId'])
    if req_error:
        return req_error
    reports_controller.create_default_reports(req_session.get_auth_token(), req_session.get_req_param('dataSourceId'))
    return req_session.generate_response(200)    