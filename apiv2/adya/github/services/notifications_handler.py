
from adya.common.utils.request_session import RequestSession
from adya.github.synchronizers import notifications_receiver

def receive_github_notifications(event, context):
    req_session = RequestSession(event)
    req_error = req_session.validate_authorized_request(False, headers=["X-GitHub-Event"])
    if req_error:
        return
    response = notifications_receiver.receive_notification(req_session.get_req_header("X-GitHub-Event"), req_session.get_body())
    return req_session.generate_response(response.get_response_code(), response.get_response_body()) 