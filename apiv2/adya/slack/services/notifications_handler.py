from adya.common.utils.request_session import RequestSession
from adya.slack.synchronizers import notifications_receiver


def receive_slack_notifications(event, context):
    req_session = RequestSession(event)
    req_error = req_session.validate_authorized_request(False, mandatory_params=[], optional_params=[])
    if req_error:
        return req_error

    response = notifications_receiver.receive_notifications(req_session.get_body())
    return req_session.generate_sqlalchemy_response(202, response or {})