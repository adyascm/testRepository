from adya.controllers import reports_controller, domainDataController, resourceController
from adya.common import aws_utils
from adya.common.request_session import RequestSession


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
    user_group_tree = domainDataController.get_user_group_tree(auth_token)
    return req_session.generate_sqlalchemy_response(200, user_group_tree)

def get_resources(event, context):
    req_session = RequestSession(event)
    req_error = req_session.validate_authorized_request(optional_params=["prefix"])
    if req_error:
        return req_error
    auth_token = req_session.get_auth_token()

    resource_list = resourceController.search_resources(auth_token, req_session.get_req_param("prefix"))
    return req_session.generate_sqlalchemy_response(200, resource_list)

def get_resource_tree_data(event, context):
    req_session = RequestSession(event)
    req_error = req_session.validate_authorized_request()
    if req_error:
        return req_error
    auth_token = req_session.get_auth_token()

    payload = req_session.get_body()
    user_emails = payload.get("userEmails")
    resource_list = resourceController.get_resources(auth_token,user_emails)
    return req_session.generate_sqlalchemy_response(200, resource_list)

def get_scheduled_reports(event, context):
    req_session = RequestSession(event)
    req_error = req_session.validate_authorized_request()
    if req_error:
        return req_error

    reports = reports_controller.get_report(req_session.get_auth_token())
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
    report_name = report.name
    cloudwatch_event_name = report_id + '-' + report_name

    aws_utils.create_cloudwatch_event(cloudwatch_event_name, cron_expression)

    return req_session.generate_sqlalchemy_response(201, report)
