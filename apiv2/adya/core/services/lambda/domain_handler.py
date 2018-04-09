from adya.core.controllers import domain_controller
from adya.common.utils.request_session import RequestSession

def get_datasource(event, context):
    req_session = RequestSession(event)
    req_error = req_session.validate_authorized_request()
    if req_error:
        return req_error

    datasources = domain_controller.get_datasource(
        req_session.get_auth_token(), None)
    return req_session.generate_sqlalchemy_response(200, datasources)


def post_datasource(event, context):
    req_session = RequestSession(event)
    req_error = req_session.validate_authorized_request()
    if req_error:
        return req_error

    try:
        datasource = domain_controller.create_datasource(req_session.get_auth_token(), req_session.get_body())
    except Exception as ex:
        return req_session.generate_error_response(400, ex.message)
    return req_session.generate_sqlalchemy_response(200, datasource)

def delete_datasource(event, context):
    req_session = RequestSession(event)
    req_error = req_session.validate_authorized_request(True, ["datasourceId"])
    if req_error:
        return req_error
    domain_controller.delete_datasource(req_session.get_auth_token(), req_session.get_req_param("datasourceId"))
    return req_session.generate_response(200)

def async_datasource_delete(event, context):
    req_session = RequestSession(event)
    req_error = req_session.validate_authorized_request(True, ["datasourceId"])
    if req_error:
        return req_error
    
    domain_controller.async_delete_datasource(req_session.get_auth_token(), req_session.get_req_param("datasourceId"))
    return req_session.generate_response(200)
