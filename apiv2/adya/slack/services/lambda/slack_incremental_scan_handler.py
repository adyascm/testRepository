from adya.common.utils.request_session import RequestSession
from adya.slack.incremental_scan import process_notifications


def process_slack_notifications(event, context):
    req_session = RequestSession(event)
    req_error = req_session.validate_authorized_request(False, mandatory_params=[], optional_params=[])
    if req_error:
        return req_error

    response = process_notifications(req_session.get_body())
    return req_session.generate_sqlalchemy_response(202, {"challenge": response})