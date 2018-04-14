import json
from adya.common.utils.request_session import RequestSession
from adya.gsuite import actions

def add_permissions_action(event, context):
    req_session = RequestSession(event)
    req_error = req_session.validate_authorized_request(True, ['user_email','initiated_by_email', 'datasource_id'])
    if req_error:
        return req_error

    gsuite_action = actions.AddOrUpdatePermisssionForResource(req_session.get_auth_token(), req_session.get_body(),
                                                              req_session.get_req_param('user_email'),
                                                              req_session.get_req_param('initiated_by_email'),
                                                              req_session.get_req_param('datasource_id'))
    updated_permissions = gsuite_action.add_permissions()
    return req_session.generate_sqlalchemy_response(200, updated_permissions)

def delete_permissions_action(event, context):
    req_session = RequestSession(event)
    req_error = req_session.validate_authorized_request(True, ['user_email', 'initiated_by_email', 'datasource_id'])
    if req_error:
        return req_error

    gsuite_action = actions.AddOrUpdatePermisssionForResource(req_session.get_auth_token(), req_session.get_body(),
                                                              req_session.get_req_param('user_email'),
                                                              req_session.get_req_param('initiated_by_email'),
                                                              req_session.get_req_param('datasource_id'))
    updated_permissions = gsuite_action.delete_permissions()
    return req_session.generate_sqlalchemy_response(200, updated_permissions)


def update_permissions_action(event, context):
    req_session = RequestSession(event)
    req_error = req_session.validate_authorized_request(True, ['user_email', 'initiated_by_email', 'datasource_id'])
    if req_error:
        return req_error
    gsuite_action = actions.AddOrUpdatePermisssionForResource(req_session.get_auth_token(), req_session.get_body(),
                                                              req_session.get_req_param('user_email'),
                                                              req_session.get_req_param('initiated_by_email'),
                                                              req_session.get_req_param('datasource_id'))

    updated_permissions = gsuite_action.update_permissions()
    return req_session.generate_sqlalchemy_response(200, updated_permissions)
