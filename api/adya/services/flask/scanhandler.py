from flask_restful import Resource, reqparse, request
from adya.datasources.google import scan, permission,parent
from adya.common import utils
from adya.common.request_session import RequestSession
from adya.db.models import DataSource
from adya.controllers import domain_controller,actions_controller
from adya.common.response_messages import Logger

class DriveScan(Resource):
    def post(self):
        req_session = RequestSession(request)
        req_error = req_session.validate_authorized_request(
            True, ['isAdmin' ,'dataSourceId', 'domainId', 'serviceAccountEnabled'])
        if req_error:
            return req_error

        domain_controller.start_scan(req_session.get_auth_token(), req_session.get_req_param(
            'domainId'), req_session.get_req_param('dataSourceId'),req_session.get_req_param('isAdmin'),req_session.get_req_param('serviceAccountEnabled'))
        return req_session.generate_response(202)

class DriveResources(Resource):
    def get(self):
        Logger().info("started initial gdrive scan")
        req_session = RequestSession(request)
        req_error = req_session.validate_authorized_request(
            True, ['dataSourceId', 'domainId','ownerEmail'], ['nextPageToken','userEmail'])
        if req_error:
            return req_error

        scan.get_resources(req_session.get_auth_token(), req_session.get_req_param('domainId'), 
                    req_session.get_req_param('dataSourceId'),req_session.get_req_param('ownerEmail'),
                    req_session.get_req_param('nextPageToken'),req_session.get_req_param('userEmail'))
        return req_session.generate_response(202)

    def post(self):
        Logger().info("Processing Data")
        req_session = RequestSession(request)
        req_error = req_session.validate_authorized_request(
            True, ['dataSourceId', 'domainId'],['userEmail', 'is_new_resource', 'notify_app'])
        if req_error:
            return req_error

        is_new_resource = req_session.get_req_param('is_new_resource') or 1
        notify_app = req_session.get_req_param('notify_app') or 0
        scan.process_resource_data(req_session.get_req_param(
            'domainId'), req_session.get_req_param('dataSourceId'), req_session.get_req_param('userEmail'), req_session.get_body(),
            is_new_resource, notify_app)
        return req_session.generate_response(202)


class GetPermission(Resource):
    def post(self):
        Logger().info("Getting Permission Data")
        req_session = RequestSession(request)
        req_error = req_session.validate_authorized_request(
            True, ['dataSourceId', 'domainId'],['userEmail'])
        if req_error:
            return req_error

        requestdata = req_session.get_body()
        fileIds = requestdata['fileIds']
        domain_id = req_session.get_req_param('domainId')
        datasource_id = req_session.get_req_param('dataSourceId')
        user_email = req_session.get_req_param('userEmail')
        ## creating the instance of scan_permission class
        scan_permisssion_obj = permission.GetPermission(domain_id, datasource_id , fileIds)
        ## calling get permission api
        scan_permisssion_obj.get_permission(user_email)
        return req_session.generate_response(202)

class GetDomainuser(Resource):
    def get(self):
        Logger().info("Getting domain user")
        req_session = RequestSession(request)
        req_error = req_session.validate_authorized_request(
            True, ['dataSourceId', 'domainId'],["nextPageToken"])
        if req_error:
            return req_error

        domain_id = req_session.get_req_param('domainId')
        datasource_id = req_session.get_req_param('dataSourceId')
        next_page_token = req_session.get_req_param('nextPageToken')
        auth_token =  req_session.get_auth_token()

        scan.getDomainUsers(datasource_id, auth_token, domain_id, next_page_token)
        return req_session.generate_response(202)

    def post(self):
        Logger().info("Process users data")
        req_session = RequestSession(request)
        req_error = req_session.validate_authorized_request(
            True, ['dataSourceId', 'domainId'])
        if req_error:
            return req_error
        auth_token =  req_session.get_auth_token()
        domain_id = req_session.get_req_param('domainId')
        datasource_id = req_session.get_req_param('dataSourceId')

        data = req_session.get_body()
        users_response_data = data.get("usersResponseData")
        scan.processUsers(auth_token,users_response_data, datasource_id, domain_id)
        return req_session.generate_response(202)


class GetDomainGroups(Resource):
    def get(self):
        Logger().info("Getting domain groups")
        req_session = RequestSession(request)
        req_error = req_session.validate_authorized_request(
            True, ['dataSourceId', 'domainId'],["nextPageToken"])
        if req_error:
            return req_error

        domain_id = req_session.get_req_param('domainId')
        datasource_id = req_session.get_req_param('dataSourceId')
        next_page_token = req_session.get_req_param('nextPageToken')
        auth_token =  req_session.get_auth_token()

        scan.getDomainGroups(datasource_id, auth_token , domain_id, next_page_token)
        return req_session.generate_response(202)

    def post(self):
        Logger().info("Process groups data")
        req_session = RequestSession(request)
        req_error = req_session.validate_authorized_request(
            True, ['dataSourceId', 'domainId'])
        if req_error:
            return req_error
    
        domain_id = req_session.get_req_param('domainId')
        datasource_id = req_session.get_req_param('dataSourceId')
        auth_token = req_session.get_auth_token()
        data = req_session.get_body()
        group_response_data = data.get("groupsResponseData")

        scan.processGroups(group_response_data, datasource_id ,domain_id, auth_token)
        return req_session.generate_response(202)


class GetGroupMembers(Resource):
        
    def post(self):
        req_session = RequestSession(request)
        req_error = req_session.validate_authorized_request(
            True, ['dataSourceId', 'domainId'])
        if req_error:
            return req_error

        data = req_session.get_body()
        domain_id = req_session.get_req_param('domainId')
        datasource_id = req_session.get_req_param('dataSourceId')
        group_keys = data.get('groupKeys')

        scan.get_group_data(req_session.get_auth_token(), domain_id,datasource_id, group_keys)
        return req_session.generate_response(202)

class GetUserApp(Resource):
    def post(self):
        req_session = RequestSession(request)
        req_error = req_session.validate_authorized_request(
            True, ['dataSourceId', 'domainId'])
        if req_error:
            return req_error

        data = req_session.get_body()
        domain_id = req_session.get_req_param('domainId')
        datasource_id = req_session.get_req_param('dataSourceId')
        user_email_list = data.get('userEmailList')

        scan.get_all_user_app(req_session.get_auth_token(), domain_id,datasource_id, user_email_list)
        return req_session.generate_response(202)
    
    def delete(self):
        req_session = RequestSession(request)
        req_error = req_session.validate_authorized_request(
            True, ['dataSourceId',"userEmail","clientId"])
        if req_error:
            return req_error

        datasource_id = req_session.get_req_param('dataSourceId')
        user_email = req_session.get_req_param('userEmail')
        client_id = req_session.get_req_param('clientId')
        response = actions_controller.revoke_user_app_access(req_session.get_auth_token(), datasource_id,user_email,client_id)
        if response:
            return req_session.generate_response(202, "Action submitted successfully")
        else:
            return req_session.generate_response(400, 'Action Failed - ' + gsuite_action.get_exception_message())
