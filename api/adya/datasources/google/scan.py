from adya.datasources.google import gutils
from adya.common import constants
from requests_futures.sessions import FuturesSession
import requests,json,time
from adya.db.connection import db_connection
from adya.db.models import Resource

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
    resourceList =[]
    session = FuturesSession()
    db_session = db_connection().get_session()
    for resourcedata in resources:
        resource = {}
        resource["domain_id"] = domain_id
        resource["datasource_id"] = datasource_id
        resource["resource_id"] = resourcedata['id']
        resource["resource_name"] = resourcedata['name']
        resource["resource_type"] = gutils.get_file_type_from_mimetype(resourcedata['mimeType'])
        # resource.resouce_parent = resourcedata.get('parents')
        resource["resource_owner_id"] = resourcedata['owners'][0].get('emailAddress')
        resource["resource_size"] = resourcedata.get('size')
        resource["creation_time"] = resourcedata['createdTime'][:-1]
        resource["last_modified_time"] = resourcedata['modifiedTime'][:-1]
        resource["exposure_type"] = constants.ResourceExposureType.PRIVATE
        resourceList.append(resource)
        batch_request_file_id_list.append(resourcedata['id'])
        if(len(batch_request_file_id_list)==100):
            requestdata = {"fileIds":batch_request_file_id_list,"domainId":domain_id}
            session.post(constants.GET_PERMISSION_URL,json.dumps(requestdata))
            batch_request_file_id_list=[]
    if (len(batch_request_file_id_list) > 0):
        requestdata = {"fileIds": batch_request_file_id_list, "domainId": domain_id}
        session.post(constants.GET_PERMISSION_URL, json.dumps(requestdata))
    try:
        db_session.bulk_insert_mappings(Resource,resourceList)
        db_session.commit()
    except Exception as ex:
        print("Resource_update failes", ex)
