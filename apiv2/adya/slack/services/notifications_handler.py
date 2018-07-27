from adya.common.utils.request_session import RequestSession
from adya.slack.synchronizers import notifications_receiver
from adya.slack.synchronizers.get_accesslogs import get_accesslogs


def receive_slack_notifications(event, context):
    req_session = RequestSession(event)
    req_error = req_session.validate_authorized_request(False, mandatory_params=[], optional_params=[])
    if req_error:
        return req_error

    response = notifications_receiver.receive_notifications(req_session.get_body())
    return req_session.generate_sqlalchemy_response(202, response or {})


def get_accesslogs_handler(event, context):
    req_session = RequestSession(event)
    req_error = req_session.validate_authorized_request(True, mandatory_params=['datasource_id'], optional_params=['page_num'])
    if req_error:
        return req_error
    response = get_accesslogs(req_session.get_req_param('datasource_id'), req_session.get_req_param('page_num'))
    return req_session.generate_response(response)


