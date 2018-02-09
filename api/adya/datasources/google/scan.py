from adya.controllers.domain_controller import update_datasource, get_datasource
from adya.datasources.google import gutils
from adya.common import constants, errormessage
from requests_futures.sessions import FuturesSession
import uuid
import json
import time
import datetime
from adya.db.connection import db_connection
from adya.db import models
from sqlalchemy import and_
from adya.db.models import DataSource
from adya.common import utils
#from adya.realtimeframework.ortc_conn import RealtimeConnection


# To avoid lambda timeout (5min) we are making another httprequest to process fileId with nextPagetoke
def get_resources(auth_token, domain_id, datasource_id, next_page_token=None):
    drive_service = gutils.get_gdrive_service(domain_id=domain_id)
    file_count = 0
    starttime = time.time()
    session = FuturesSession()
    while True:
        try:
            print ("Got file data")
            results = drive_service.files().\
                list(q="", fields="files(id, name, mimeType, parents, "
                     "owners, size, createdTime, modifiedTime), "
                     "nextPageToken", pageSize=1000, pageToken=next_page_token).execute()

            file_count = len(results['files'])
            update_and_get_count(
                datasource_id, DataSource.file_count, file_count, True)
            url = constants.SCAN_RESOURCES + "?domainId=" + \
                domain_id + "&dataSourceId=" + datasource_id
            utils.post_call_with_authorization_header(
                session, url, auth_token, results)
            next_page_token = results.get('nextPageToken')
            if next_page_token:
                timediff = time.time() - starttime
                if timediff >= constants.NEXT_CALL_FROM_FILE_ID:
                    url = constants.SCAN_RESOURCES + "?domainId=" + \
                        domain_id + "&dataSourceId=" + datasource_id + "&nextPageToken=" + next_page_token
                    utils.get_call_with_authorization_header(
                        session, url, auth_token)
                    break
            else:
                break
        except Exception as ex:
            print ex
            break


## processing resource data for fileIds
def process_resource_data(auth_token, domain_id, datasource_id, resources):
    batch_request_file_id_list = []
    resourceList = []
    session = FuturesSession()
    db_session = db_connection().get_session()
    for resourcedata in resources:
        resource = {}
        resource["domain_id"] = domain_id
        resource["datasource_id"] = datasource_id
        resource["resource_id"] = resourcedata['id']
        resource["resource_name"] = resourcedata['name']
        resource["resource_type"] = gutils.get_file_type_from_mimetype(
            resourcedata['mimeType'])
        resource["resource_parent_id"] = resourcedata.get('parents')
        resource["resource_owner_id"] = resourcedata['owners'][0].get(
            'emailAddress')
        resource["resource_size"] = resourcedata.get('size')
        resource["creation_time"] = resourcedata['createdTime'][:-1]
        resource["last_modified_time"] = resourcedata['modifiedTime'][:-1]
        resource["exposure_type"] = constants.ResourceExposureType.PRIVATE
        resourceList.append(resource)

        batch_request_file_id_list.append(resourcedata['id'])
        if len(batch_request_file_id_list) == 100:
            get_permission_for_fileId(auth_token, 
                batch_request_file_id_list, domain_id, datasource_id, session)
            batch_request_file_id_list = []
    if len(batch_request_file_id_list) > 0:
        get_permission_for_fileId(auth_token, 
            batch_request_file_id_list, domain_id, datasource_id, session)
    try:
        db_session.bulk_insert_mappings(models.Resource, resourceList)
        db_session.commit()
    except Exception as ex:
        print("Resource_update failes", ex)


def get_permission_for_fileId(auth_token, batch_request_file_id_list, domain_id, datasource_id, session):
    requestdata = {"fileIds": batch_request_file_id_list}
    url = constants.SCAN_PERMISSIONS + "?domainId=" + \
                domain_id + "&dataSourceId=" + datasource_id
    utils.post_call_with_authorization_header(session,url,auth_token,json.dumps(requestdata))
    proccessed_file_count = len(batch_request_file_id_list)
    update_and_get_count(datasource_id, DataSource.proccessed_file_permission_count, proccessed_file_count, True)


def getDomainUsers(datasource_id, auth_token, domain_id, next_page_token):
    print("Getting domain user from google")

    directory_service = gutils.get_directory_service(domain_id)
    starttime = time.time()
    session = FuturesSession()

    while True:
        try:
            print ("Got users data")
            results = directory_service.users().list(customer='my_customer', maxResults=500, pageToken=next_page_token,
                                                     orderBy='email').execute()

            data = {"usersResponseData": results["users"]}
            user_count = len(results["users"])
            # no need to send user count to ui , so passing send_message flag as false
            update_and_get_count(
                datasource_id, DataSource.user_count, user_count, False)
            url = constants.SCAN_DOMAIN_USERS + "?domainId=" + \
                domain_id + "&dataSourceId=" + datasource_id
            utils.post_call_with_authorization_header(session,url,auth_token,data)
            next_page_token = results.get('nextPageToken')
            if next_page_token:
                timediff = time.time() - starttime
                if timediff >= constants.NEXT_CALL_FROM_FILE_ID:
                    url = constants.SCAN_RESOURCES + "?domainId=" + \
                        domain_id + "&dataSourceId=" + datasource_id + "&nextPageToken=" + next_page_token
                    utils.get_call_with_authorization_header(session, url, auth_token)
                    break
            else:
                update_and_get_count(
                    datasource_id, DataSource.user_count, 0, True)
                break
        except Exception as ex:
            print ex
            break


def processUsers(users_data, datasource_id, domain_id):
    print ("Started processing users meta data")
    user_db_insert_data_dic = []
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
        db_session.bulk_insert_mappings(
            models.DomainUser, user_db_insert_data_dic)
        db_session.commit()
    except Exception as ex:
        print("User data insertation failed", ex.message)


def getDomainGroups(datasource_id, auth_token, domain_id, next_page_token):
    print("Getting domain user from google")
    directory_service = gutils.get_directory_service(domain_id)
    starttime = time.time()
    session = FuturesSession()

    while True:
        try:
            print ("Got users data")
            results = directory_service.groups().list(customer='my_customer', maxResults=500,
                                                      pageToken=next_page_token).execute()

            group_count = len(results["groups"])
            update_and_get_count(
                datasource_id, DataSource.group_count, group_count, False)
            data = {"groupsResponseData": results["groups"]}

            url = constants.SCAN_DOMAIN_GROUPS + "?domainId=" + \
                domain_id + "&dataSourceId=" + datasource_id
            utils.post_call_with_authorization_header(session, url, auth_token, data)
            next_page_token = results.get('nextPageToken')
            if next_page_token:
                timediff = time.time() - starttime
                if timediff >= constants.NEXT_CALL_FROM_FILE_ID:
                    data = {"dataSourceId": datasource_id,
                            "domainId": domain_id,
                            "nextPageToken": next_page_token}
                    url = constants.SCAN_DOMAIN_GROUPS + "?domainId=" + \
                        domain_id + "&dataSourceId=" + datasource_id + "&nextPageToken=" + next_page_token
                    utils.get_call_with_authorization_header(session, url, auth_token)
                    break
            else:
                break
        except Exception as ex:
            print ex
            break


def processGroups(groups_data, datasource_id, domain_id, auth_token):
    print ("Started processing users meta data")
    groups_db_insert_data_dic = []
    session = FuturesSession()

    data = {"domainId": domain_id, "dataSourceId": datasource_id}
    for group_data in groups_data:
        group = {}
        group["domain_id"] = domain_id
        group["datasource_id"] = datasource_id
        groupemail = group_data["email"]
        group["email"] = groupemail
        group["name"] = group_data["name"]
        groups_db_insert_data_dic.append(group)
        data["groupKey"] = groupemail
        utils.post_call_with_authorization_header(
            session, constants.SCAN_GROUP_MEMBERS, auth_token, data)

    try:
        db_session = db_connection().get_session()
        db_session.bulk_insert_mappings(
            models.DomainGroup, groups_db_insert_data_dic)
        db_session.commit()
    except Exception as ex:
        print("User data insertation failed", ex.message)


def getGroupsMember(group_key, auth_token, datasource_id, domain_id, next_page_token):
    directory_service = gutils.get_directory_service(domain_id)
    starttime = time.time()
    session = FuturesSession()

    while True:
        try:
            groupmemberresponse = directory_service.members().list(groupKey=group_key).execute()
            groupMember = groupmemberresponse.get("members")
            if groupMember:
                data = {"membersResponseData": groupMember}
                url = constants.SCAN_GROUP_MEMBERS + "?domainId=" + \
                domain_id + "&dataSourceId=" + datasource_id + "&groupKey=" + group_key 
                utils.post_call_with_authorization_header(session, url, auth_token, data)
            else:
                update_and_get_count(
                    datasource_id, DataSource.proccessed_group_memebers_count, 1, True)

            next_page_token = groupmemberresponse.get('nextPageToken')
            if next_page_token:
                timediff = time.time() - starttime
                if timediff >= constants.NEXT_CALL_FROM_FILE_ID:
                    data = {"dataSourceId": datasource_id,
                            "domainId": domain_id,
                            "groupKey": group_key,
                            "nextPageToken": next_page_token}
                    url = constants.SCAN_GROUP_MEMBERS + "?domainId=" + \
                        domain_id + "&dataSourceId=" + datasource_id + "&groupKey=" + group_key + "&nextPageToken=" + next_page_token
                    utils.get_call_with_authorization_header(session, url, auth_token, data)
                    break
            else:
                break
        except Exception as ex:
            print ex
            break


def processGroupMembers(group_key, group_member_data,  datasource_id, domain_id):
    groupsmembers_db_insert_data = []
    db_session = db_connection().get_session()
    for group_data in group_member_data:

        if group_data.get("type") == "CUSTOMER":
            db_session.query(models.DomainGroup).filter(
                and_(models.DomainGroup.datasource_id == datasource_id, models.DomainGroup.domain_id == domain_id,
                     models.DomainGroup.email == group_key)).update({'include_all_user': True})
            continue
        else:
            group = {"domain_id": domain_id, "datasource_id": datasource_id, "member_email": group_data["email"],
                     "parent_email": group_key}
            groupsmembers_db_insert_data.append(group)

    try:
        db_session.bulk_insert_mappings(
            models.DirectoryStructure, groupsmembers_db_insert_data)
        db_session.commit()
        update_and_get_count(
            datasource_id, DataSource.proccessed_group_memebers_count, 1, True)
    except Exception as ex:
        print("Directory data insertation failed", ex.message)
        return errormessage.SCAN_FAILED_ERROR_MESSAGE


def update_and_get_count(datasource_id, column_name, column_value, send_message=False):
    rows_updated = update_datasource(datasource_id, column_name, column_value)
    if rows_updated == 1:
        datasource = get_datasource(None, datasource_id)
        #if send_message:
        #ortc_client = RealtimeConnection().get_conn()
        # ortc_client.send(datasource_id, datasource)
    #TODO: handle if update failed
