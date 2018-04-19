from adya.common.utils.request_session import RequestSession
from adya.core.controllers import alert_controller

def post_alert(event, context):
    req_session = RequestSession(event)
    req_error = req_session.validate_authorized_request()

    if req_error:
        return req_error
    alerts = alert_controller.create_alerts(req_session.auth_token, req_session.get_body())
    return req_session.generate_sqlalchemy_response(201, alerts)

def get_alert(event, context):
    req_session = RequestSession(event)
    req_error = req_session.validate_authorized_request(optional_params=["fetchViolationCount"])

    if req_error:
        return req_error
    alerts = alert_controller.get_alerts(req_session.auth_token(), req_session.get_req_param("fetchViolationCount"))
    return req_session.generate_sqlalchemy_response(200, alerts)