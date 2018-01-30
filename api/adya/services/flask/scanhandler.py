from flask_restful import Resource,reqparse,request
from adya.datasources.google import scan,permission
import json


class initialgdrivescan(Resource):
    def post(self):
        print "started initial gdrive scan"
        data = json.loads(request.data)
        datasource_id = data.get("dataSourceId")
        access_token = data.get("accessToken")
        domian_id = data.get("domainId")
        scan.initial_datasource_scan(datasource_id,access_token,domian_id)
        # 202 for accespted
        return "Scan Started", 202


class gdriveScan(Resource):
    def post(self):
        print "started scan"
        data = json.loads(request.data)
        datasource_id = data.get("dataSourceId")
        access_token = data.get("accessToken")
        domian_id = data.get("domainId")
        scan.gdrivescan(datasource_id, access_token, domian_id)
        # 202 for accespted
        return "Scan Started", 202


class processResources(Resource):
    def post(self):
        print "Processing Data"
        request_data = json.loads(request.data)
        resources = request_data.get('resourceData')["files"]
        datasource_id = request_data.get('dataSourceId')
        domain_id = request_data.get('domainId')
        scan.process_resource_data(resources,domain_id,datasource_id)
        return "Data has processed", 200


class getPermission(Resource):
    def post(self):
        print "Getting Permission Data"
        requestdata = json.loads(request.data)
        fileIds = requestdata['fileIds']
        domain_id = requestdata['domainId']
        datasource_id = requestdata["dataSourceId"]
        ## creating the instance of scan_permission calss
        scan_permisssion_obj = permission.GetPermission(domain_id,datasource_id,fileIds)
        ## calling get permission api
        scan_permisssion_obj.get_permission()
        return "Getting file permission", 202


class getdomainuser(Resource):
    def post(self):
        print("Getting domain user")
        data = json.loads(request.data)
        datasource_id = data.get("dataSourceId")
        access_token = data.get("accessToken")
        domian_id = data.get("domainId")
        next_page_token = data.get("nextPageToken")
        scan.getDomainUsers(datasource_id,access_token,domian_id,next_page_token)
        return "Getting users data", 202


class processUsers(Resource):
    def post(self):
        print("Process Users data")
        data = json.loads(request.data)
        datasource_id = data.get("dataSourceId")
        domian_id = data.get("domainId")
        users_response_data = data.get("usersResponseData")
        scan.processUsers(users_response_data,datasource_id,domian_id)
        return "processing users metadata", 202


class getdomainGroups(Resource):
    def post(self):
        print("Getting domain user")
        data = json.loads(request.data)
        datasource_id = data.get("dataSourceId")
        access_token = data.get("accessToken")
        domian_id = data.get("domainId")
        next_page_token = data.get("nextPageToken")
        scan.getDomainUsers(datasource_id,access_token,domian_id,next_page_token)
        return "Getting users data", 202


class processGroups(Resource):
    def post(self):
        print("Process Users data")
        data = json.loads(request.data)
        datasource_id = data.get("dataSourceId")
        domian_id = data.get("domainId")
        users_response_data = data.get("groupsResponseData")
        scan.processUsers(users_response_data,datasource_id,domian_id)
        return "processing users metadata", 202