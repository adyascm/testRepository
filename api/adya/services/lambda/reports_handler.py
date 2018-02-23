from adya.controllers import reports_controller, domainDataController, resourceController, domain_controller
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
    resource_list = resourceController.get_resources(auth_token, user_emails)
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
    report_name = report.name
    cloudwatch_event_name = report_id + '-' + report_name

    aws_utils.create_cloudwatch_event(cloudwatch_event_name, cron_expression)

    return req_session.generate_sqlalchemy_response(201, report)


def modify_scheduled_report(event, context):
    req_session = RequestSession(event)
    req_error = req_session.validate_authorized_request()
    if req_error:
        return req_error

    update_record = reports_controller.update_report(req_session.get_auth_token(), req_session.get_body())

    # frequency = report.frequency
    # cloudwatch_eventname = report.name + "_" + report.report_id  # TODO: if someone changes the report_name
    # aws_utils.create_cloudwatch_event(cloudwatch_eventname, frequency)
    return req_session.generate_sqlalchemy_response(201, update_record)


def delete_scheduled_report(event, context):
    req_session = RequestSession(event)
    req_error = req_session.validate_authorized_request(True, ['reportId'])
    if req_error:
        return req_error
    deleted_report = reports_controller.delete_report(req_session.get_auth_token(),
                                                      req_session.get_req_param('reportId'))

    cloudwatch_eventname = deleted_report.name + "_" + deleted_report.report_id
    aws_utils.delete_cloudwatch_event(cloudwatch_eventname)
    return req_session.generate_response(200)


def run_scheduled_report(event, context):
    req_session = RequestSession(event)
    req_error = req_session.validate_authorized_request(True, ['reportId'])
    if req_error:
        return req_error

    auth_token = req_session.get_auth_token()
    data_source = domain_controller.get_datasource(auth_token, None)

    domain_id = data_source[0].domain_id
    datasource_id = data_source[0].datasource_id

    run_report_data, email_list, report_type, report_desc = reports_controller.run_report(domain_id, datasource_id, req_session.get_auth_token(),
                                                                req_session.get_req_param('reportId'))
    return req_session.generate_sqlalchemy_response(200, run_report_data)


def execute_cron_report(event, context):
    req_session = RequestSession(event)
    req_error = req_session.validate_authorized_request(True, ["reportId"])
    if req_error:
        return req_error

    if req_error:
        return req_error

    csv_records, email_list, report_desc = reports_controller.generate_csv_report(req_session.get_auth_token(), req_session.get_req_param('reportId'))

    aws_utils.send_email_with_attachment(email_list, csv_records, report_desc)

    return req_session.generate_response(200)