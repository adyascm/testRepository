from flask_restful import Resource, reqparse, request
from adya.datasources.google import scan, permission,parent
from adya.common import utils
from adya.common.request_session import RequestSession
from adya.db.models import DataSource
from adya.controllers import domain_controller,actions_controller


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
        print "started initial gdrive scan"
        req_session = RequestSession(request)
        req_error = req_session.validate_authorized_request(
            True, ['dataSourceId', 'domainId'], ['nextPageToken','userEmail'])
        if req_error:
            return req_error

        scan.get_resources(req_session.get_auth_token(), req_session.get_req_param('domainId'), req_session.get_req_param(
            'dataSourceId'),req_session.get_req_param('nextPageToken'),req_session.get_req_param('userEmail'))
        return req_session.generate_response(202)

    def post(self):
        print "Processing Data"
        req_session = RequestSession(request)
        req_error = req_session.validate_authorized_request(
            True, ['dataSourceId', 'domainId'],['userEmail'])
        if req_error:
            return req_error

        scan.process_resource_data(req_session.get_req_param(
            'domainId'), req_session.get_req_param('dataSourceId'), req_session.get_req_param('userEmail'), req_session.get_body())
        return req_session.generate_response(202)


class GetPermission(Resource):
    def post(self):
        print "Getting Permission Data"
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



class GetParent(Resource):
    def get(self):
        print "Get parents from google api and process"
        req_session = RequestSession(request)
        req_error = req_session.validate_authorized_request(
            True, ['dataSourceId', 'domainId'],['userEmail'])
        if req_error:
            return req_error
        domain_id = req_session.get_req_param('domainId')
        datasource_id = req_session.get_req_param('dataSourceId')
        user_email = req_session.get_req_param('userEmail')
        auth_token = req_session.get_auth_token()
        scan.get_parent_for_user(auth_token,domain_id,datasource_id,user_email)
        return req_session.generate_response(202)

    def post(self):
        print "Getting Parents Data"
        req_session = RequestSession(request)
        req_error = req_session.validate_authorized_request(
            True, ['dataSourceId', 'domainId'],['userEmail'])
        if req_error:
            return req_error

        requestdata = req_session.get_body()
        file_ids = requestdata['fileIds']
        domain_id = req_session.get_req_param('domainId')
        datasource_id = req_session.get_req_param('dataSourceId')
        user_email = req_session.get_req_param('userEmail')
        resource_count = len(file_ids)
        processed_file_count =0
        while processed_file_count <= resource_count:
            ## creating the instance of parents class
            hundred_file = file_ids[processed_file_count:processed_file_count+100]
            scan_parent_obj = parent.GetParents(domain_id, datasource_id , hundred_file ,user_email)
            ## calling get parents api
            scan_parent_obj.get_parent()
            processed_file_count += 100
        scan.update_and_get_count(datasource_id, DataSource.processed_parent_permission_count, 1, True)
        return req_session.generate_response(202)


class GetDomainuser(Resource):
    def get(self):
        print("Getting domain user")
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
        print("Process users data")
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
        print("Getting domain groups")
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
        print("Process groups data")
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

        scan.get_group_data(domain_id,datasource_id, group_keys)
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
            True, ['dataSourceId', 'domainId',"userEmail","clientId"])
        if req_error:
            return req_error

        domain_id = req_session.get_req_param('domainId')
        datasource_id = req_session.get_req_param('dataSourceId')
        user_email = req_session.get_req_param('userEmail')
        client_id = req_session.get_req_param('clientId')
        actions_controller.revoke_user_app_access(domain_id,datasource_id,user_email,client_id)
        return req_session.generate_response(204)
