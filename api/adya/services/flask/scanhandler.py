from flask_restful import Resource, reqparse, request
from adya.datasources.google import scan, permission
import json
from adya.common.request_session import RequestSession


class DriveResources(Resource):
    def get(self):
        print "started initial gdrive scan"
        req_session = RequestSession(request)
        req_error = req_session.validate_authorized_request(
            True, ['dataSourceId', 'domainId'], ['next_page_token'])
        if req_error:
            return req_error

        scan.get_resources(req_session.get_req_param(
            'dataSourceId'), req_session.get_auth_token(), req_session.get_req_param('domainId'))
        return req_session.generate_response(202)

    def post(self):
        print "Processing Data"
        req_session = RequestSession(request)
        req_error = req_session.validate_authorized_request(
            True, ['dataSourceId', 'domainId'])
        if req_error:
            return req_error

        scan.process_resource_data(req_session.get_req_param(
            'domainId'), req_session.get_req_param('dataSourceId'), req_session.get_body())
        return req_session.generate_response(202)


class getPermission(Resource):
    def post(self):
        print "Getting Permission Data"
        req_session = RequestSession(request)
        req_error = req_session.validate_authorized_request(
            True, ['dataSourceId', 'domainId'])
        if req_error:
            return req_error

        requestdata = json.loads(request.data)
        fileIds = requestdata['fileIds']
        ## creating the instance of scan_permission class
        scan_permisssion_obj = permission.GetPermission(req_session.get_req_param(
            'domainId'), req_session.get_req_param('dataSourceId'), fileIds)
        ## calling get permission api
        scan_permisssion_obj.get_permission()
        return req_session.generate_response(202)


class getdomainuser(Resource):
    def post(self):
        print("Getting domain user")
        req_session = RequestSession(request)
        req_error = req_session.validate_authorized_request(
            True, ['dataSourceId', 'domainId'])
        if req_error:
            return req_error

        data = json.loads(request.data)
        next_page_token = data.get("nextPageToken")
        scan.getDomainUsers(req_session.get_req_param('dataSourceId'), req_session.get_auth_token(
        ), req_session.get_req_param('domainId'), next_page_token)
        return req_session.generate_response(202)


class processUsers(Resource):
    def post(self):
        print("Process users data")
        req_session = RequestSession(request)
        req_error = req_session.validate_authorized_request(
            True, ['dataSourceId', 'domainId'])
        if req_error:
            return req_error

        data = json.loads(request.data)
        users_response_data = data.get("usersResponseData")
        scan.processUsers(users_response_data, req_session.get_req_param(
            'dataSourceId'), req_session.get_req_param('domainId'))
        return req_session.generate_response(202)


class getdomainGroups(Resource):
    def post(self):
        print("Getting domain groups")
        req_session = RequestSession(request)
        req_error = req_session.validate_authorized_request(
            True, ['dataSourceId', 'domainId'])
        if req_error:
            return req_error

        data = json.loads(request.data)
        next_page_token = data.get("nextPageToken")
        scan.getDomainGroups(req_session.get_req_param('dataSourceId'), req_session.get_auth_token(
        ), req_session.get_req_param('domainId'), next_page_token)
        return req_session.generate_response(202)


class processGroups(Resource):
    def post(self):
        print("Process groups data")
        req_session = RequestSession(request)
        req_error = req_session.validate_authorized_request(
            True, ['dataSourceId', 'domainId'])
        if req_error:
            return req_error

        data = json.loads(request.data)
        group_response_data = data.get("groupsResponseData")
        scan.processGroups(group_response_data, req_session.get_req_param(
            'dataSourceId'), req_session.get_req_param('domainId'), req_session.get_auth_token())
        return req_session.generate_response(202)


class getGroupMembers(Resource):
    def post(self):
        req_session = RequestSession(request)
        req_error = req_session.validate_authorized_request(
            True, ['dataSourceId', 'domainId'])
        if req_error:
            return req_error

        data = json.loads(request.data)
        group_key = data.get('groupKey')
        next_page_token = data.get('nextPageToken')
        scan.getGroupsMember(group_key, req_session.get_auth_token(), req_session.get_req_param(
            'dataSourceId'), req_session.get_req_param('domainId'), next_page_token)
        return req_session.generate_response(202)


class processGroupMembers(Resource):
    def post(self):
        req_session = RequestSession(request)
        req_error = req_session.validate_authorized_request(
            True, ['dataSourceId', 'domainId', 'groupKey'])
        if req_error:
            return req_error

        data = json.loads(request.data)
        group_key = data.get("groupKey")
        member_response_data = data.get("membersResponseData")
        scan.processGroupMembers(eq_session.get_req_param('groupKey'), member_response_data, req_session.get_req_param(
            'dataSourceId'), req_session.get_req_param('domainId'))
        return req_session.generate_response(202)
