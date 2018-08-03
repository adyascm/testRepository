from adya.common.utils.request_session import RequestSession
from adya.core.controllers.activity_controller import get_activites_for_domain


def get_all_activities(event, context):
    req_session = RequestSession(event)
    req_error = req_session.validate_authorized_request()
    if req_error:
        return req_error

    activities = get_activites_for_domain(req_session.get_body())
    return req_session.generate_sqlalchemy_response(200, activities)
