import json
from adya.core.controllers import reports_controller, directory_controller, resource_controller, domain_controller
from adya.common.utils import aws_utils
from adya.common.utils.request_session import RequestSession
from adya.common.response_messages import Logger

def get_widget_data(event, context):
    req_session = RequestSession(event)
    req_error = req_session.validate_authorized_request(True, ['widgetId'])
    if req_error:
        return req_error

    data = reports_controller.get_widget_data(
        req_session.get_auth_token(), req_session.get_req_param('widgetId'))
    return req_session.generate_sqlalchemy_response(200, data)


def get_user_tree_data(event, context):
    req_session = RequestSession(event)
    req_error = req_session.validate_authorized_request()
    if req_error:
        return req_error
    auth_token = req_session.get_auth_token()
    user_group_tree = directory_controller.get_user_group_tree(auth_token)
    return req_session.generate_sqlalchemy_response(200, user_group_tree)

def get_user_app(event,context):
    req_session = RequestSession(event)
    req_error = req_session.validate_authorized_request(True,optional_params=["clientId","userEmail"])
    if req_error:
        return req_error
    auth_token = req_session.get_auth_token()
    client_id = req_session.get_req_param('clientId')
    user_email = req_session.get_req_param('userEmail')
    if client_id:
        data = directory_controller.get_users_for_app(auth_token,client_id)
    elif user_email:
        data = directory_controller.get_apps_for_user(auth_token,user_email)
    else:
        data = directory_controller.get_all_apps(auth_token)

    return req_session.generate_sqlalchemy_response(200, data)


def get_resources(event, context):
    req_session = RequestSession(event)
    req_error = req_session.validate_authorized_request(optional_params=["prefix"])
    if req_error:
        return req_error
    auth_token = req_session.get_auth_token()

    resource_list = resource_controller.search_resources(auth_token, req_session.get_req_param("prefix"))
    return req_session.generate_sqlalchemy_response(200, resource_list)


def get_resource_tree_data(event, context):
    req_session = RequestSession(event)
    req_error = req_session.validate_authorized_request(optional_params=["pageNumber","pageSize"])
    if req_error:
        return req_error
    auth_token = req_session.get_auth_token()

    payload = req_session.get_body()
    user_emails = payload.get("userEmails")
    exposure_type = payload.get("exposureType")
    resource_type = payload.get("resourceType")
    page_number = payload.get("pageNumber")
    page_size = payload.get("pageSize")
    owner_email_id = payload.get("ownerEmailId")
    parent_folder = payload.get("parentFolder")
    selected_date = payload.get("selectedDate")
    search_prefix = payload.get("prefix")
    resource_list = resource_controller.get_resources(auth_token,page_number,page_size, user_emails, exposure_type, resource_type, search_prefix, owner_email_id, parent_folder, selected_date)
    return req_session.generate_sqlalchemy_response(200, resource_list)


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
    function_name = aws_utils.get_lambda_name('get', 'executescheduledreport')

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
    function_name = aws_utils.get_lambda_name('get', 'executescheduledreport')
    aws_utils.create_cloudwatch_event(report_id, frequency, function_name, payload)
    return req_session.generate_sqlalchemy_response(201, update_record)


def delete_scheduled_report(event, context):
    req_session = RequestSession(event)
    req_error = req_session.validate_authorized_request(True, ['reportId'])
    if req_error:
        return req_error
    deleted_report = reports_controller.delete_report(req_session.get_auth_token(),
                                                      req_session.get_req_param('reportId'))

    function_name = aws_utils.get_lambda_name('get', 'executescheduledreport')
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

    Logger().info("call send_email_with_attachment function ")

    aws_utils.send_email_with_attachment(email_list, csv_records, report_desc, report_name)

    return req_session.generate_response(200)