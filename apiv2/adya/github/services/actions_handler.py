
from adya.common.utils.request_session import RequestSession
from adya.common.constants import action_constants, constants
from adya.github.actions import github_action_facade

def execute_github_actions(event, context):
    req_session = RequestSession(event)
    req_error = req_session.validate_authorized_request(True)
    if req_error:
        return req_error

    #Navigate to actions_facade
    response = github_action_facade.execute_github_actions(req_session.get_auth_token(), req_session.get_body())

    log_status = action_constants.ActionStatus.SUCCESS.value
    status_code = 200
    status_message = "Action completed successfully"

    if response['action_status'] == constants.ResponseType.ERROR.value:
        log_status = action_constants.ActionStatus.FAILED.value
        status_code = 404
        status_message = "Action Failed"

    return req_session.generate_response(status_code, response)
    