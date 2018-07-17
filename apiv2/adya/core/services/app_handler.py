from flask_restful import Resource, request
from adya.common.utils.request_session import RequestSession
from adya.core.controllers import app_controller, directory_controller

# def get_inventory_licenses(event, context):
#     req_session = RequestSession(event)
#     req_error = req_session.validate_authorized_request()
#     if req_error:
#         return req_error
#     licenses = app_controller.create_licenses()
#     return req_session.generate_sqlalchemy_response(200, licenses)
    
def get_app_stats(event, context):
    req_session = RequestSession(event)
    req_error = req_session.validate_authorized_request(True)
    if req_error:
        return req_error
    data = app_controller.get_app_stats(req_session.get_auth_token())
    return req_session.generate_sqlalchemy_response(200, data)

def get_user_app(event,context):
    req_session = RequestSession(event)
    req_error = req_session.validate_authorized_request(True,optional_params=["filterType", "appId", "domainId", "userEmail", "datasourceId", "pageNumber","pageSize","sortColumn","sortOrder","appName"])
    if req_error:
        return req_error
    auth_token = req_session.get_auth_token()
    filter_type = req_session.get_req_param('filterType')
    data = {}
    if filter_type == 'USER_APPS':
        app_id = req_session.get_req_param('appId')
        domain_id = req_session.get_req_param('domainId')
        user_email = req_session.get_req_param('userEmail')
        datasource_id = req_session.get_req_param('datasourceId')
        sort_column_name = req_session.get_req_param("sortColumn")
        sort_order = req_session.get_req_param("sortOrder")
        if app_id:
            data = directory_controller.get_users_for_app(auth_token, domain_id, app_id, sort_column_name, sort_order)
        elif user_email:
            data = directory_controller.get_apps_for_user(auth_token, datasource_id, user_email)
        else:
            data = directory_controller.get_all_apps(auth_token)
    elif filter_type == 'INSTALLED_APPS':
        app_name = req_session.get_req_param("appName")
        page_number = req_session.get_req_param("pageNumber")
        page_size = req_session.get_req_param("pageSize")
        sort_column_name = req_session.get_req_param("sortColumn")
        sort_order = req_session.get_req_param("sortOrder")
        apps, total_count = app_controller.get_installed_apps(auth_token, page_number, page_size, app_name, sort_column_name, sort_order)
        data = {'apps':apps, 'last_page':total_count}
    elif filter_type == 'INVENTORY_APPS':  
        app_name = req_session.get_req_param("appName")
        page_num =  req_session.get_req_param("pageNumber")
        page_size =  req_session.get_req_param("pageSize")
        apps, total_count = app_controller.get_inventory_apps(auth_token, page_num, page_size, app_name)
        data = {'apps':apps, 'last_page':total_count}
    return req_session.generate_sqlalchemy_response(200, data)

def modify_user_app(event, context):
    req_session = RequestSession(event)
    req_error = req_session.validate_authorized_request()
    if req_error:
        return req_error
    apps = directory_controller.update_apps(req_session.get_auth_token(), req_session.get_body())
    return req_session.generate_sqlalchemy_response(201, apps)    

def post_user_app(event, context):
    req_session = RequestSession(event)
    req_error = req_session.validate_authorized_request()
    if req_error:
        return req_error
    apps = directory_controller.insert_apps(req_session.get_auth_token(), req_session.get_body())
    return req_session.generate_sqlalchemy_response(201, apps)  