from adya.datasources.google import gutils
from adya.common import constants
from requests_futures.sessions import FuturesSession
import requests,json,time
from adya.db.db_conn import db_connection
from adya.db.dbschema.models import Resource

# To avoid lambda timeout (5min) we are making another httprequest to process fileId with nextPagetoke
def initial_datasource_scan(datasource_id,access_token,domain_id,next_page_token = None):

    drive_service = gutils.get_gdrive_service()
    file_count = 0
    starttime = time.time()
    session = FuturesSession()
    while True:
        try:
            print ("Got file data")
            results = drive_service.files().\
                list(q = "", fields = "files(id, name, mimeType, parents, "
                                "owners, size, createdTime, modifiedTime), "
                                "nextPageToken",pageSize=1000, pageToken = next_page_token).execute()

            file_count = file_count + len(results['files'])
            data = json.dumps({"resourceData":results,"domainId":domain_id,"datasourceId":datasource_id})
            session.post(constants.PROCESS_RESOURCES_URL,data=data)
            next_page_token = results.get('nextPageToken')
            if next_page_token:
                timediff = time.time() - starttime
                if timediff >= constants.NEXT_CALL_FROM_FILE_ID:
                    data = {"dataSourceId":datasource_id,
                            "AccessToken":access_token,
                            "domainId":domain_id,
                            "nextPageToken": next_page_token}
                    session.post(constants.GDRIVE_SCAN_URL,data)
                    break
            else:
                break
        except Exception as ex:
            print ex
            break

## processing resource data for fileIds
def process_resource_data(resources, domain_id, datasource_id):

    batch_request_file_id_list =[]
    resource_datalist =[]
    session = FuturesSession()
    for resourcedata in resources:

        resouce_id = resourcedata['id']
        resouce_name = resourcedata['name']
        resouce_mymeType = gutils.get_file_type_from_mimetype(resourcedata['mimeType'])
        resouce_parent = resourcedata.get('parents')
        resouce_owner = resourcedata['owners'][0].get('emailAddress')
        resouce_size = resourcedata.get('size')
        resouce_createdtime = resourcedata['createdTime']
        resouce_modifiedtime = resourcedata['modifiedTime']
        data = [domain_id,datasource_id,resouce_id,resouce_name,resouce_mymeType,resouce_owner,resouce_size,resouce_createdtime,resouce_modifiedtime]
        resource_datalist.append(data)
        batch_request_file_id_list.append(resouce_id)

        if(len(batch_request_file_id_list)==100):
            requestdata = {"fileIds":batch_request_file_id_list,"domainId":domain_id}
            session.post(constants.GET_PERMISSION_URL,json.dumps(requestdata))
            batch_request_file_id_list=[]
    if (len(batch_request_file_id_list) > 0):
        requestdata = {"fileIds": batch_request_file_id_list, "domainId": domain_id}
        session.post(constants.GET_PERMISSION_URL, json.dumps(requestdata))

## this class is use to get permisson for drive resources
class GetPermission():
    domain_id =""

    def __init__(self, domain_id,fileIds):
        self.domain_id = domain_id
        self.fileIds = fileIds

    # callback will be called for each fileId, here request_id will be in same order we have created the request
    def resource_permissioncallback(self,request_id, response, exception):
            fileid = self.fileIds[int(request_id)-1]
            if response:
                print ("Got Permission Input", request_id, fileid,response.get('permissions'))
            print("domain_id",self.domain_id)

    # getting permissison for 100 resourceId
    def get_permission(self):
        drive_service = gutils.get_gdrive_service()
        batch = drive_service.new_batch_http_request(callback=self.resource_permissioncallback)

        for fileid in self.fileIds:
            permisssionData = drive_service.permissions().list(fileId=fileid, fields="permissions(id, emailAddress, role, displayName), nextPageToken",
                                                       pageSize=100,pageToken = None)
            batch.add(permisssionData)
        batch.execute()
