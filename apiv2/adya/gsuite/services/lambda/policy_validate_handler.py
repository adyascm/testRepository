
from adya.common.utils.request_session import RequestSession
from adya.gsuite import policy_validator_permission_change

def validate_policy(event, context):
    req_session = RequestSession(event)
    req_error = req_session.validate_authorized_request(True, ['dataSourceId'])
    if req_error:
        return req_error
    policy_validator_permission_change.validate_permission_change(req_session.get_auth_token(), req_session.get_req_param('dataSourceId'), req_session.get_body())
    return req_session.generate_response(200)