from adya.datasources.google import gutils
from adya.common import constants,errormessage
from requests_futures.sessions import FuturesSession
import uuid,json,time,datetime
from adya.db.connection import db_connection
from adya.db import models
from sqlalchemy import and_
from adya.db.models import DataSource


def gdrivescan(access_token,domain_id):
    datasource_id = str(uuid.uuid4())
    db_session = db_connection().get_session()
    datasource = DataSource()
    datasource.domain_id = domain_id
    datasource.datasource_id = datasource_id
    datasource.display_name = gutils.get_domain_name_from_email(domain_id)
    # we are fixing the datasoure type this can be obtained from the frontend
    datasource.datasource_type = "GSUITE"
    datasource.creation_time = datetime.datetime.utcnow().isoformat()
    try:
        db_session.add(datasource)
        db_session.commit()
    except Exception as ex:
        print("Creating datasource id failed", ex.message)
        return errormessage.SCAN_FAILED_ERROR_MESSAGE

    data = json.dumps({"domainId": domain_id,"accessToken":access_token, "dataSourceId": datasource_id})
    session = FuturesSession()
    session.post(constants.INITIAL_GDRIVE_SCAN,data=data)
    session.post(constants.GET_DOMAIN_USER_URL, data=data)
    session.post(constants.GET_GROUP_URL, data=data)

# To avoid lambda timeout (5min) we are making another httprequest to process fileId with nextPagetoke
def initial_datasource_scan(datasource_id,access_token,domain_id,next_page_token = None):

    drive_service = gutils.get_gdrive_service(domain_id=domain_id)
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
            data = json.dumps({"resourceData":results,"domainId":domain_id,"dataSourceId":datasource_id})
            session.post(constants.PROCESS_RESOURCES_URL,data=data)
            next_page_token = results.get('nextPageToken')
            if next_page_token:
                timediff = time.time() - starttime
                if timediff >= constants.NEXT_CALL_FROM_FILE_ID:
                    data = {"dataSourceId":datasource_id,
                            "accessToken":access_token,
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
        resource["resource_parent_id"] = resourcedata.get('parents')
        resource["resource_owner_id"] = resourcedata['owners'][0].get('emailAddress')
        resource["resource_size"] = resourcedata.get('size')
        resource["creation_time"] = resourcedata['createdTime'][:-1]
        resource["last_modified_time"] = resourcedata['modifiedTime'][:-1]
        resource["exposure_type"] = constants.ResourceExposureType.PRIVATE
        resourceList.append(resource)
        batch_request_file_id_list.append(resourcedata['id'])
        if(len(batch_request_file_id_list)==100):
            requestdata = {"fileIds":batch_request_file_id_list,"domainId":domain_id,"dataSourceId":datasource_id}
            session.post(constants.GET_PERMISSION_URL,json.dumps(requestdata))
            batch_request_file_id_list=[]
    if (len(batch_request_file_id_list) > 0):
        requestdata = {"fileIds": batch_request_file_id_list, "domainId": domain_id ,"dataSourceId":datasource_id}
        session.post(constants.GET_PERMISSION_URL, json.dumps(requestdata))
    try:
        db_session.bulk_insert_mappings(models.Resource,resourceList)
        db_session.commit()
    except Exception as ex:
        print("Resource_update failes", ex)


def getDomainUsers(datasource_id,access_token,domain_id,next_page_token):
    print("Getting domain user from google")

    directory_service = gutils.get_directory_service(domain_id)
    starttime = time.time()
    session = FuturesSession()

    while True:
        try:
            print ("Got users data")
            results = directory_service.users().list(customer='my_customer', maxResults=500, pageToken=next_page_token,
                                                     orderBy='email').execute()

            data = {"usersResponseData":results["users"],"dataSourceId":datasource_id,"domainId":domain_id}
            session.post(url=constants.PROCESS_USERS_DATA_URL, data=json.dumps(data))
            next_page_token = results.get('nextPageToken')
            if next_page_token:
                timediff = time.time() - starttime
                if timediff >= constants.NEXT_CALL_FROM_FILE_ID:
                    data = {"dataSourceId":datasource_id,
                            "accessToken":access_token,
                            "domainId":domain_id,
                            "nextPageToken": next_page_token}
                    session.post(constants.GDRIVE_SCAN_URL,data)
                    break
            else:
                break
        except Exception as ex:
            print ex
            break


def processUsers(users_data, datasource_id, domain_id):

    print ("Started processing users meta data")
    user_db_insert_data_dic =[]
    for user_data in users_data:
        useremail = user_data["emails"][0]["address"]
        names = user_data["name"]
        user = {}
        user["domain_id"] = domain_id
        user["datasource_id"] = datasource_id
        user["email"] = useremail
        user["first_name"] = names.get("givenName")
        user["last_name"] = names.get("familyName")
        user["member_type"] = constants.UserMemberType.INTERNAL
        user_db_insert_data_dic.append(user)

    try:
        db_session = db_connection().get_session()
        db_session.bulk_insert_mappings(models.DomainUser,user_db_insert_data_dic)
        db_session.commit()
    except Exception as ex:
        print("User data insertation failed", ex.message)


def getDomainGroups(datasource_id,access_token,domain_id,next_page_token):
    print("Getting domain user from google")

    directory_service = gutils.get_directory_service(domain_id)
    starttime = time.time()
    session = FuturesSession()

    while True:
        try:
            print ("Got users data")
            results = directory_service.groups().list(customer='my_customer', maxResults=500, pageToken=next_page_token).execute()

            data = {"groupsResponseData":results["groups"],"accessToken":access_token,
                    "dataSourceId":datasource_id,"domainId":domain_id}
            session.post(url=constants.PROCESS_GROUP_DATA_URL, data=json.dumps(data))
            next_page_token = results.get('nextPageToken')
            if next_page_token:
                timediff = time.time() - starttime
                if timediff >= constants.NEXT_CALL_FROM_FILE_ID:
                    data = {"dataSourceId":datasource_id,
                            "accessToken":access_token,
                            "domainId":domain_id,
                            "nextPageToken": next_page_token}
                    session.post(constants.GDRIVE_SCAN_URL,data)
                    break
            else:
                break
        except Exception as ex:
            print ex
            break


def processGroups(groups_data, datasource_id, domain_id,access_token):

    print ("Started processing users meta data")
    groups_db_insert_data_dic =[]
    session = FuturesSession()
    data = {"domainId":domain_id,"dataSourceId":datasource_id,"accessToken":access_token}
    for group_data in groups_data:
        group = {}
        group["domain_id"] = domain_id
        group["datasource_id"] = datasource_id
        groupemail = group_data["email"]
        group["email"] = groupemail
        group["name"] = group_data["name"]
        groups_db_insert_data_dic.append(group)
        data["groupKey"] = groupemail
        session.post(url=constants.GET_GROUP_MEMBERS_URL,data=json.dumps(data))
    try:
        db_session = db_connection().get_session()
        db_session.bulk_insert_mappings(models.DomainGroup,groups_db_insert_data_dic)
        db_session.commit()
    except Exception as ex:
        print("User data insertation failed", ex.message)


def getGroupsMember(group_key,access_token, datasource_id,domain_id,next_page_token):

    print ("Started getting group Members")
    directory_service = gutils.get_directory_service(domain_id)
    starttime = time.time()
    session = FuturesSession()

    while True:
        try:
            print ("Got users data")
            groupmemberresponse = directory_service.members().list(groupKey=group_key).execute()
            groupMember = groupmemberresponse.get("members")
            if groupMember:
                data = {"membersResponseData": groupMember, "groupKey":group_key,
                        "dataSourceId": datasource_id,"access_token":access_token, "domainId": domain_id}
                session.post(url=constants.PROCESS_GROUP_MEMBER_DATA_URL, data=json.dumps(data))
            next_page_token = groupmemberresponse.get('nextPageToken')
            if next_page_token:
                timediff = time.time() - starttime
                if timediff >= constants.NEXT_CALL_FROM_FILE_ID:
                    data = {"dataSourceId": datasource_id,
                            "accessToken": access_token,
                            "domainId": domain_id,
                            "groupKey": group_key,
                            "nextPageToken": next_page_token}
                    session.post(constants.GET_GROUP_MEMBERS_URL, data)
                    break
            else:
                break
        except Exception as ex:
            print ex
            break


def processGroupMembers(group_key, group_member_data,  datasource_id, domain_id):
    print ("Started processing groupmember meta data")
    groupsmembers_db_insert_data_dic = []
    db_session = db_connection().get_session()
    for group_data in group_member_data:
        if group_data.get("type") == "CUSTOMER":
            db_session.query(models.DomainGroup).filter(
                and_(models.DomainGroup.datasource_id == datasource_id, models.DomainGroup.domain_id == domain_id)) \
                .update({'include_all_user': True})
            continue
        else:
            group = {}
            group["domain_id"] = domain_id
            group["datasource_id"] = datasource_id
            group["member_email"] = group_data["email"]
            group["parent_email"] = group_key
            groupsmembers_db_insert_data_dic.append(group)
    try:
        db_session.bulk_insert_mappings(models.DirectoryStructure, groupsmembers_db_insert_data_dic)
        db_session.commit()
    except Exception as ex:
        print("Directory data insertation failed", ex.message)
        return errormessage.SCAN_FAILED_ERROR_MESSAGE