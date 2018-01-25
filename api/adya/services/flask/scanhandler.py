from flask_restful import Resource,reqparse,request
from adya.datasources.google import scan
import json

class initialDSScan(Resource):
    def post(self):
        print "started scan"
        data = json.loads(request.data)
        datasource_id = data.get("dataSourceId")
        access_token = data.get("AccessToken")
        domian_id = data.get("domainId")
        scan.initial_datasource_scan(datasource_id,access_token,domian_id)
        # 202 for accespted
        return "Scan Started", 202


class processResources(Resource):
    def post(self):
        print "Processing Data"
        request_data = json.loads(request.data)
        resources = request_data.get('resourceData')["files"]
        datasource_id = request_data.get('datasourceId')
        domain_id = request_data.get('domainId')
        scan.process_resource_data(resources,domain_id,datasource_id)
        return "Data has processed", 200

class getPermission(Resource):
    def post(self):
        print "Getting Permission Data"
        requestdata = json.loads(request.data)
        fileIds = requestdata['fileIds']
        domain_id = requestdata['domainId']
        scan_permisssion = scan.GetPermission(domain_id,fileIds)
        scan_permisssion.get_permission()
        return "Getting file permission", 202