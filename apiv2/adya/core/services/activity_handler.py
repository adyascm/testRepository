from adya.common.utils.request_session import RequestSession
from adya.core.controllers.activity_controller import get_activites_for_domain
from adya.core.controllers.activity_controller import get_activity_events

def get_all_activities(event, context):
    req_session = RequestSession(event)
    req_error = req_session.validate_authorized_request()
    if req_error:
        return req_error

    activities = get_activites_for_domain(req_session.get_body())
    return req_session.generate_sqlalchemy_response(200, activities)

def get_all_activity_events(event,context):
    req_session = RequestSession(event)
    req_error = req_session.validate_authorized_request()
    if req_error:
        return req_error
    events = get_activity_events()
    return req_session.generate_sqlalchemy_response(200, events)
