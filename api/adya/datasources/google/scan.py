from adya.controllers.domain_controller import update_datasource, get_datasource
from adya.datasources.google import gutils, incremental_scan
from adya.common import constants, errormessage
from requests_futures.sessions import FuturesSession
import uuid,json,time,datetime
from adya.db.connection import db_connection
from adya.db import models
from adya.common.constants import UserMemberType
from sqlalchemy import and_
from adya.db.models import DataSource,ResourcePermission,Resource,LoginUser,DomainUser,ResourceParent
from adya.common import utils, messaging
#from adya.realtimeframework.ortc_conn import RealtimeConnection
from adya.email_templates import adya_emails


# To avoid lambda timeout (5min) we are making another httprequest to process fileId with nextPagetoke
def get_resources(auth_token, domain_id, datasource_id,next_page_token=None,user_email=None):
    # here nextPageToken as none means it is first call for resource
    # useremail None means servie account is not verified and we are scaning data for loggedin user only
    print "Initiating fetching data for drive resources using email: {} next_page_token: {}".format(user_email, next_page_token)

    drive_service = gutils.get_gdrive_service(domain_id,user_email)
    starttime = time.time()
    session = FuturesSession()
    last_future = None
    quotaUser = None
    queryString = ""
    if user_email:
        quotaUser = user_email[0:41]
        queryString = "'"+ user_email +"' in owners"
    while True:
        try:
            results = drive_service.files().list(q=queryString, fields="files(id, name, webContentLink, webViewLink, iconLink, "
                            "thumbnailLink, description, lastModifyingUser, mimeType, parents, "
                            "permissions(id, emailAddress, role, displayName, expirationTime, deleted),"
                            "owners,size,createdTime, modifiedTime), "
                            "nextPageToken", pageSize=1000, quotaUser= quotaUser, pageToken=next_page_token).execute()
            file_count = len(results['files'])

            resourcedata = {}
            resourcedata["resources"] = results['files'][0:50]
            print "Received drive resources for {} files using email: {} next_page_token: {}".format(file_count, user_email, next_page_token)

            update_and_get_count(datasource_id, DataSource.total_file_count, file_count, True)

            query_params = {'domainId': domain_id, 'dataSourceId': datasource_id, 'userEmail': (user_email  if user_email else domain_id)}
            messaging.trigger_post_event(constants.SCAN_RESOURCES,auth_token, query_params, resourcedata)
            if file_count > 50:
                resourcedata = {}
                resourcedata["resources"] = results['files'][50:100]
                messaging.trigger_post_event(constants.SCAN_RESOURCES,auth_token, query_params, resourcedata)

            next_page_token = results.get('nextPageToken')
            if next_page_token:
                timediff = time.time() - starttime
                if timediff >= constants.NEXT_CALL_FROM_FILE_ID:
                    query_params = {'domainId': domain_id, 'dataSourceId': datasource_id, 'nextPageToken': next_page_token}
                    if user_email:
                        query_params["userEmail"] = user_email
                    messaging.trigger_get_event(constants.SCAN_RESOURCES,auth_token, query_params)
                    break
            else:
                #Set the scan - fetch status as complete
                update_and_get_count(datasource_id, DataSource.file_scan_status, 1, False)
                break
        except Exception as ex:
            update_and_get_count(datasource_id, DataSource.file_scan_status, 10001, False)
            print "Exception occurred while getting data for drive resources using email: {} next_page_token: {}".format(user_email, next_page_token)
            print ex
            break


## processing resource data for fileIds
def process_resource_data(domain_id, datasource_id, user_email, resourcedata):
    print "Initiating processing of drive resources for files using email: {}".format(user_email)
    resources = resourcedata["resources"]
    resourceList = []
    session = FuturesSession()
    db_session = db_connection().get_session()
    data_for_permission_table =[]
    data_for_parent_table =[]
    external_user_map = {}
    resource_count = 0
    for resourcedata in resources:
        resource_count = resource_count + 1
        resource = {}
        resource["domain_id"] = domain_id
        resource["datasource_id"] = datasource_id
        resource_id = resourcedata['id']
        resource["resource_id"] = resource_id
        resource["resource_name"] = resourcedata['name']
        mime_type = gutils.get_file_type_from_mimetype(resourcedata['mimeType'])
        resource["resource_type"] = mime_type
        resource["resource_owner_id"] = resourcedata['owners'][0].get('emailAddress')
        resource["resource_size"] = resourcedata.get('size')
        resource["creation_time"] = resourcedata['createdTime'][:-1]
        resource["last_modified_time"] = resourcedata['modifiedTime'][:-1]
        resource["web_content_link"] = resourcedata.get("webContentLink")
        resource["web_view_link"] = resourcedata.get("webViewLink")
        resource["icon_link"] = resourcedata.get("iconLink")
        resource["thumthumbnail_link"] = resourcedata.get("thumbnailLink")
        resource["description"] = resourcedata.get("description")
        resource["last_modifying_user_email"] = ""
        if resourcedata.get("lastModifyingUser"):
            resource["last_modifying_user_email"] = resourcedata["lastModifyingUser"].get("emailAddress")
        resource_exposure_type = constants.ResourceExposureType.PRIVATE
        resource_permissions = resourcedata.get('permissions')
        if resource_permissions:
            for permission in resource_permissions:
                    permission_id = permission.get('id')
                    email_address = permission.get('emailAddress')
                    display_name = permission.get('displayName')
                    expiration_time = permission.get('expirationTime')
                    is_deleted = permission.get('deleted')
                    if email_address:
                        if resource_exposure_type != constants.ResourceExposureType.EXTERNAL \
                            and resource_exposure_type != constants.ResourceExposureType.PUBLIC \
                            and resource_exposure_type != constants.ResourceExposureType.DOMAIN :
                                resource_exposure_type = constants.ResourceExposureType.INTERNAL
                        if gutils.check_if_external_user(domain_id,email_address):
                            if resource_exposure_type != constants.ResourceExposureType.PUBLIC:
                                resource_exposure_type = constants.ResourceExposureType.EXTERNAL
                            ## insert non domain user as External user in db, Domain users will be
                            ## inserted during processing Users
                            if not email_address in external_user_map:

                                externaluser = {}
                                externaluser["domain_id"] = domain_id
                                externaluser["datasource_id"] = datasource_id
                                externaluser["email"] = email_address
                                externaluser["first_name"] = ""
                                externaluser["last_name"] = ""
                                if display_name and display_name != "":
                                    name_list = display_name.split(' ')
                                    externaluser["first_name"] = name_list[0]
                                    if len(name_list) > 1:
                                        externaluser["last_name"] = name_list[1]
                                externaluser["member_type"] = constants.UserMemberType.EXTERNAL
                                external_user_map[email_address]= externaluser
                    elif display_name:
                        if resource_exposure_type != constants.ResourceExposureType.EXTERNAL and \
                            resource_exposure_type != constants.ResourceExposureType.PUBLIC:
                            resource_exposure_type = constants.ResourceExposureType.DOMAIN
                        email_address = "__ANYONE__@"+ domain_id
                    else:
                        resource_exposure_type = constants.ResourceExposureType.PUBLIC
                        email_address = constants.ResourceExposureType.PUBLIC
                    resource_permission = {}
                    resource_permission["domain_id"] = domain_id
                    resource_permission["datasource_id"] = datasource_id
                    resource_permission["resource_id"] = resource_id
                    resource_permission["email"] = email_address
                    resource_permission["permission_id"] = permission_id
                    resource_permission["permission_type"] = permission['role']
                    resource_permission["name"] = display_name
                    if expiration_time:
                        resource_permission["expiration_time"] = expiration_time[:-1]
                    resource_permission["is_deleted"] = is_deleted
                    data_for_permission_table.append(resource_permission)
        resource["exposure_type"] = resource_exposure_type
        resource["parent_id"] = resourcedata.get('parents')[0] if resourcedata.get('parents') else None
        # resource_parent_data = resourcedata.get('parents')
        # resource_parent = {}
        # resource_parent["domain_id"] = domain_id
        # resource_parent["datasource_id"] = datasource_id
        # resource_parent["email"] = user_email
        # resource_parent["resource_id"] = resource_id
        # resource_parent["parent_id"] = resource_parent_data[0] if resource_parent_data else None
        # data_for_parent_table.append(resource_parent)
        resourceList.append(resource)
    try:
        db_session.bulk_insert_mappings(Resource, resourceList)
        db_session.bulk_insert_mappings(ResourcePermission, data_for_permission_table)
        # db_session.bulk_insert_mappings(ResourceParent, data_for_parent_table)
        if len(external_user_map)>0:
            db_session.execute(DomainUser.__table__.insert().prefix_with("IGNORE").values(external_user_map.values()))
        db_session.commit()
        update_and_get_count(datasource_id, DataSource.processed_file_count, resource_count, True)

        print "Processed drive resources for {} files using email: {}".format(resource_count, user_email)
    except Exception as ex:
        update_and_get_count(datasource_id, DataSource.file_scan_status, 10001, False)
        print "Exception occurred while processing data for drive resources using email: {}".format(user_email)
        print ex
    finally:
        db_session.close()



def get_permission_for_fileId(auth_token,user_email, batch_request_file_id_list, domain_id, datasource_id, session):
    requestdata = {"fileIds": batch_request_file_id_list}
    url = constants.SCAN_PERMISSIONS + "?domainId=" + \
                domain_id + "&dataSourceId=" + datasource_id
    if user_email:
        url = url +"&userEmail=" + user_email
    utils.post_call_with_authorization_header(session,url,auth_token,requestdata).result()
    processed_file_count = len(batch_request_file_id_list)
    update_and_get_count(datasource_id, DataSource.processed_file_count, processed_file_count, True)


def get_parent_for_user(auth_token, domain_id, datasource_id,user_email):
    print ("Started getting parents data", user_email)
    db_session = db_connection().get_session()
    useremail_resources_map = {}
    if user_email:
        resources_data = db_session.query(Resource.resource_id).distinct(Resource.resource_id)\
                               .filter(and_(Resource.domain_id == domain_id, 
                               Resource.datasource_id == datasource_id,Resource.resource_id != constants.ROOT)).all()
        update_and_get_count(datasource_id,DataSource.user_count_for_parent,1)
        useremail_resources_map[user_email] = []
        for data in resources_data:
            useremail_resources_map[user_email].append(data.resource_id)
    else:
        alluserquery = db_session.query(DomainUser.email).filter(and_(DomainUser.domain_id==domain_id,\
                               DomainUser.datasource_id == datasource_id, DomainUser.member_type == UserMemberType.INTERNAL)).subquery()
        queried_data = db_session.query(ResourcePermission.resource_id,ResourcePermission.email)\
                               .filter(and_(ResourcePermission.domain_id==domain_id,\
                               ResourcePermission.datasource_id == datasource_id,\
                               ResourcePermission.email.in_(alluserquery))).all()
        unique_email_id_count = db_session.query(ResourcePermission.email).distinct(ResourcePermission.email)\
                          .filter(and_(ResourcePermission.domain_id == domain_id,\
                          ResourcePermission.datasource_id == datasource_id,ResourcePermission.email.in_(alluserquery))).count()
        update_and_get_count(datasource_id,DataSource.user_count_for_parent,unique_email_id_count)
        for resource_map in queried_data:
            if not resource_map.email in useremail_resources_map:
                useremail_resources_map[resource_map.email] =[]
            useremail_resources_map[resource_map.email].append(resource_map.resource_id)
    last_result = None
    session = FuturesSession()
    for email in useremail_resources_map:
        batch_request_file_id_list = useremail_resources_map[email]
        requestdata = {"fileIds": batch_request_file_id_list}
        if not user_email:
            url = constants.SCAN_PARENTS + "?domainId=" + \
                        domain_id + "&dataSourceId=" + datasource_id + "&userEmail=" + email
        else:
            url = constants.SCAN_PARENTS + "?domainId=" + \
                        domain_id + "&dataSourceId=" + datasource_id
        last_result = utils.post_call_with_authorization_header(session,url,auth_token,requestdata)
    if last_result:
        last_result.result()
    db_session.close()


def getDomainUsers(datasource_id, auth_token, domain_id, next_page_token):
    print "Initiating fetching of google directory users using for domain_id: {} next_page_token: {}".format(domain_id, next_page_token)
    directory_service = gutils.get_directory_service(domain_id)
    starttime = time.time()
    session = FuturesSession()
    last_future = None
    while True:
        try:
            results = directory_service.users().list(customer='my_customer', maxResults=500, pageToken=next_page_token,
                                                     orderBy='email').execute()

            data = {"usersResponseData": results["users"]}
            user_count = len(results["users"])
            print "Received {} google directory users for domain_id: {} using next_page_token: {}".format(user_count, domain_id, next_page_token)
            # no need to send user count to ui , so passing send_message flag as false
            update_and_get_count(datasource_id, DataSource.total_user_count, user_count, False)
            url = constants.SCAN_DOMAIN_USERS + "?domainId=" + \
                domain_id + "&dataSourceId=" + datasource_id
            last_future = utils.post_call_with_authorization_header(session,url,auth_token,data)
            next_page_token = results.get('nextPageToken')
            if next_page_token:
                timediff = time.time() - starttime
                if timediff >= constants.NEXT_CALL_FROM_FILE_ID:
                    url = constants.SCAN_RESOURCES + "?domainId=" + \
                        domain_id + "&dataSourceId=" + datasource_id + "&nextPageToken=" + next_page_token
                    utils.get_call_with_authorization_header(session, url, auth_token).result()
                    break
            else:
                #Set the scan - fetch status as complete
                update_and_get_count(datasource_id, DataSource.user_scan_status, 1, False)
                break
        except Exception as ex:
            update_and_get_count(datasource_id, DataSource.user_scan_status, 2, False)
            print "Exception occurred while getting google directory users for domain_id: {} next_page_token: {}".format(domain_id, next_page_token)
            print ex
            break
    if last_future:
        last_future.result()


def processUsers(auth_token,users_data, datasource_id, domain_id):
    print "Initiating processing of google directory users for domain_id: {}".format(domain_id)

    user_db_insert_data_dic = []
    db_session = db_connection().get_session()
    datasource = db_session.query(DataSource).filter(DataSource.datasource_id == datasource_id).first()
    session = FuturesSession()
    user_email_list = []
    lastresult = None
    user_count = 0
    for user_data in users_data:
        user_count = user_count + 1
        user_email = user_data["emails"][0]["address"]
        names = user_data["name"]
        user = {}
        user["domain_id"] = domain_id
        user["datasource_id"] = datasource_id
        user["email"] = user_email
        user["first_name"] = names.get("givenName")
        user["last_name"] = names.get("familyName")
        user["full_name"] = names.get("fullName")
        user["is_admin"] = user_data.get("isAdmin")
        user["creation_time"] = user_data["creationTime"][:-1]
        user["is_suspended"] = user_data.get("suspended")
        user["primary_email"] = user_data.get("primaryEmail")
        user["user_id"] = user_data["id"]
        user["photo_url"] = user_data.get("thumbnailPhotoUrl")
        aliases = user_data.get("aliases")
        if aliases:
            user["aliases"] = ",".join(aliases)
        user["member_type"] = constants.UserMemberType.INTERNAL
        user_db_insert_data_dic.append(user)
        if datasource.is_serviceaccount_enabled:
            user_email_list.append(user_email)
    try:
        db_session.bulk_insert_mappings(models.DomainUser, user_db_insert_data_dic)
        db_session.commit()
        update_and_get_count(datasource_id, DataSource.processed_user_count, user_count, True)

        print "Processed {} google directory users for domain_id: {}".format(user_count, domain_id)

    except Exception as ex:
        update_and_get_count(datasource_id, DataSource.user_scan_status, 2, False)
        print "Exception occurred while processing google directory users for domain_id: {}".format(domain_id)
        print ex

    
    if datasource.is_serviceaccount_enabled:
        print "Google service account is enabled, starting to fetch files for each processed user"
        lastresult =None
        for user_email in user_email_list:
            url = constants.SCAN_RESOURCES + "?domainId=" + \
                domain_id + "&dataSourceId=" + datasource_id + "&userEmail=" + user_email
            lastresult = utils.get_call_with_authorization_header(session,url,auth_token)
        if lastresult:
            lastresult.result()


def getDomainGroups(datasource_id, auth_token, domain_id, next_page_token):
    print "Initiating fetching of google directory groups using for domain_id: {} next_page_token: {}".format(domain_id, next_page_token)
    directory_service = gutils.get_directory_service(domain_id)
    starttime = time.time()
    session = FuturesSession()
    last_future = None
    while True:
        try:
            results = directory_service.groups().list(customer='my_customer', maxResults=500,
                                                      pageToken=next_page_token).execute()

            group_count = len(results["groups"])
            print "Received {} google directory groups for domain_id: {} using next_page_token: {}".format(group_count, domain_id, next_page_token)
            
            update_and_get_count(datasource_id, DataSource.total_group_count, group_count, True)
            data = {"groupsResponseData": results["groups"]}

            url = constants.SCAN_DOMAIN_GROUPS + "?domainId=" + \
                domain_id + "&dataSourceId=" + datasource_id
            last_future = utils.post_call_with_authorization_header(session, url, auth_token, data)
            next_page_token = results.get('nextPageToken')
            if next_page_token:
                timediff = time.time() - starttime
                if timediff >= constants.NEXT_CALL_FROM_FILE_ID:
                    data = {"dataSourceId": datasource_id,
                            "domainId": domain_id,
                            "nextPageToken": next_page_token}
                    url = constants.SCAN_DOMAIN_GROUPS + "?domainId=" + \
                        domain_id + "&dataSourceId=" + datasource_id + "&nextPageToken=" + next_page_token
                    utils.get_call_with_authorization_header(session, url, auth_token).result()
                    break
            else:
                #Set the scan - fetch status as complete
                update_and_get_count(datasource_id, DataSource.group_scan_status, 1, False)
                break
        except Exception as ex:
            update_and_get_count(datasource_id, DataSource.group_scan_status, 2, False)
            print "Exception occurred while getting google directory groups for domain_id: {} next_page_token: {}".format(domain_id, next_page_token)
            print ex
            break
    if last_future:
        last_future.result()


def processGroups(groups_data, datasource_id, domain_id, auth_token):
    print "Initiating processing of google directory groups for domain_id: {}".format(domain_id)
    groups_db_insert_data_dic = []

    group_count = 0
    group_key_array = []
    for group_data in groups_data:
        group_count = group_count + 1
        group = {}
        group["domain_id"] = domain_id
        group["datasource_id"] = datasource_id
        group["group_id"] = group_data["id"]
        groupemail = group_data["email"]
        group["email"] = groupemail
        group["name"] = group_data["name"]
        group["direct_members_count"] = group_data["directMembersCount"]
        group["description"] = group_data.get('description')
        group_aliases = group_data.get('aliases')
        if group_aliases:
            group["aliases"] = ",".join(group_aliases)
        groups_db_insert_data_dic.append(group)   
        group_key_array.append(groupemail)

    try:
        db_session = db_connection().get_session()
        db_session.bulk_insert_mappings(models.DomainGroup, groups_db_insert_data_dic)
        db_session.commit()
        db_session.close()
        
        session = FuturesSession()
        url = constants.SCAN_GROUP_MEMBERS + "?domainId=" + \
                    domain_id + "&dataSourceId=" + datasource_id
        utils.post_call_with_authorization_header(session,url,auth_token,json ={"groupKeys":group_key_array})
        print "Processed {} google directory groups for domain_id: {}".format(group_count, domain_id)
    except Exception as ex:
        update_and_get_count(datasource_id, DataSource.group_scan_status, 2, False)
        print "Exception occurred while processing google directory groups for domain_id: {}".format(domain_id)
        print ex


# def getGroupsMember(group_key, auth_token, datasource_id, domain_id, next_page_token):
#     print "Initiating fetching of google directory group members using for domain_id: {} group_key: {} next_page_token: {}".format(domain_id, group_key, next_page_token)
#     directory_service = gutils.get_directory_service(domain_id)
#     starttime = time.time()
#     session = FuturesSession()
#     last_future = None
#     while True:
#         try:
#             groupmemberresponse = directory_service.members().list(groupKey=group_key).execute()
#             groupMember = groupmemberresponse.get("members")
#             if groupMember:
#                 data = {"membersResponseData": groupMember}
#                 url = constants.SCAN_GROUP_MEMBERS + "?domainId=" + \
#                 domain_id + "&dataSourceId=" + datasource_id + "&groupKey=" + group_key 
#                 last_future = utils.post_call_with_authorization_header(session, url, auth_token, data)
#             else:
#                 update_and_get_count(datasource_id, DataSource.processed_group_count, 1, True)
 
#             next_page_token = groupmemberresponse.get('nextPageToken')
#             if next_page_token:
#                 timediff = time.time() - starttime
#                 if timediff >= constants.NEXT_CALL_FROM_FILE_ID:
#                     url = constants.SCAN_GROUP_MEMBERS + "?domainId=" + \
#                         domain_id + "&dataSourceId=" + datasource_id + "&groupKey=" + group_key + "&nextPageToken=" + next_page_token
#                     utils.get_call_with_authorization_header(session, url, auth_token).result()
#                     break
#             else:
#                 break
#         except Exception as ex:
#             update_and_get_count(datasource_id, DataSource.group_scan_status, 2, False)
#             print "Exception occurred while getting google directory group members for domain_id: {} group_key: {} next_page_token: {}".format(domain_id, group_key, next_page_token)
#             print ex
#             break
#     if last_future:
#         last_future.result()

def get_group_data(domain_id,datasource_id,group_keys):
    processed_group_count =0
    total_no_of_group = len(group_keys)
    while processed_group_count <= total_no_of_group:
        hundred_group = group_keys[processed_group_count:processed_group_count+100]
        processed_group_count +=100
        group_class = GroupData(domain_id,datasource_id,hundred_group)
        group_class.get_group_members()


class GroupData():

    def __init__(self, domain_id, datasource_id,group_keys):
        self.domain_id = domain_id
        self.datasource_id = datasource_id
        self.group_keys = group_keys
        self.batch_length = len(group_keys)
        self.db_session = db_connection().get_session()

    def group_data_callback(self,request_id, response, exception):
        request_id = int(request_id) 
        group_key = self.group_keys[request_id - 1]
        update_and_get_count(self.datasource_id, DataSource.processed_group_count, 1, True)
        if exception:
            update_and_get_count(self.datasource_id, DataSource.group_scan_status, 2, False)
            print "Exception occurred while processing google directory group members for domain_id: {} group_key: {}".format(domain_id, group_key)
            print ex
        if response.get('members'):
            is_external = False
            for group_data in response['members']:
                member_type = group_data.get("type")
                member_id = group_data.get("id")
                member_role = group_data.get("role")
                if member_type == "CUSTOMER":
                    self.db_session.query(models.DomainGroup).filter(
                        and_(models.DomainGroup.datasource_id == self.datasource_id, models.DomainGroup.domain_id == self.domain_id,
                            models.DomainGroup.email == group_key)).update({'include_all_user': True})
                    continue
                else:
                    group = models.DirectoryStructure()
                    group.domain_id = self.domain_id
                    group.datasource_id = self.datasource_id
                    group.member_email = group_data["email"]
                    group.parent_email = group_key
                    group.member_id = member_id
                    group.member_role = member_role
                    group.member_type = member_type

                    if not is_external and gutils.check_if_external_user(self.domain_id, group.member_email):
                        is_external = True
                        self.db_session.query(models.DomainGroup).filter(and_(models.DomainGroup.domain_id == self.domain_id,
                                                                        models.DomainGroup.datasource_id == self.datasource_id,
                                                                        models.DomainGroup.email ==  group_key)).update({"is_external":is_external})
                    self.db_session.add(group)
       
        if self.batch_length == request_id:
            try:
                self.db_session.commit()
            except Exception as ex:
                print ex

    def get_group_members(self):
        directory_service = gutils.get_directory_service(self.domain_id)
        batch = directory_service.new_batch_http_request(callback=self.group_data_callback)
        for group_key in self.group_keys:
            group_member_data = directory_service.members().list(groupKey=group_key)
            batch.add(group_member_data)
        batch.execute()


    # def get_group_members():
    #     print "Initiating processing of google directory group members for domain_id: {} group_key: {}".format(domain_id, group_key)
    #     groupsmembers_db_insert_data = []
    #     member_count = 0
    #     is_external = False
    #     for group_data in group_member_data:
    #         member_count = member_count + 1
    #         member_type = group_data.get("type")
    #         member_id = group_data.get("id")
    #         member_role = group_data.get("role")
    #         if member_type == "CUSTOMER":
    #             db_session.query(models.DomainGroup).filter(
    #                 and_(models.DomainGroup.datasource_id == datasource_id, models.DomainGroup.domain_id == domain_id,
    #                     models.DomainGroup.email == group_key)).update({'include_all_user': True})
    #             continue
    #         else:
    #             group = {"domain_id": domain_id, "datasource_id": datasource_id, "member_email": group_data["email"],
    #                     "parent_email": group_key,"member_id":member_id, "member_role":member_role , "member_type": member_type}
    #             if not is_external and gutils.check_if_external_user(domain_id, group["member_email"]):
    #                 is_external=True
    #             groupsmembers_db_insert_data.append(group)
    #     try:
    #         if is_external:
    #             db_session.query(DomainGroup).filter(and_(DomainGroup.domain_id == domain_id,
    #                                             DomainGroup.datasource_id == datasource_id,
    #                                             DomainGroup.email == group_key)).update({"is_external":is_external})
    #         db_session.bulk_insert_mappings(
    #             models.DirectoryStructure, groupsmembers_db_insert_data)
    #         db_session.commit()
    #         print "Processed {} google directory group members for domain_id: {} group_key: {}".format(member_count, domain_id, group_key)
    #         update_and_get_count(datasource_id, DataSource.processed_group_count, 1, True)
    #         db_session.close()
    #     except Exception as ex:
    #         update_and_get_count(datasource_id, DataSource.group_scan_status, 2, False)
    #         print "Exception occurred while processing google directory group members for domain_id: {} group_key: {}".format(domain_id, group_key)
    #         print ex


def update_and_get_count(datasource_id, column_name, column_value, send_message=False):
    db_session = db_connection().get_session()
    rows_updated = 0
    try:
        rows_updated = update_datasource(db_session,datasource_id, column_name, column_value)
    except Exception as ex:
        print "Exception occurred while updating the scan status for the datasource."
        print ex
    if rows_updated == 1:
        datasource = get_datasource(None, datasource_id,db_session)
        if get_scan_status(datasource) == 1:
            update_resource_exposure_type(db_session,datasource.domain_id,datasource_id)
            adya_emails.send_gdrive_scan_completed_email(datasource_id)

            if constants.DEPLOYMENT_ENV != "local":
                query_params = {'domainId': datasource.domain_id, 'dataSourceId': datasource_id}
                print "Trying for push notification subscription for domain_id: {} datasource_id: {}".format(datasource.domain_id, datasource_id)
                messaging.trigger_post_event(constants.SUBSCRIBE_GDRIVE_NOTIFICATIONS_PATH, "Internal-Secret", query_params, {})

        #if send_message:
        #ortc_client = RealtimeConnection().get_conn()
        # ortc_client.send(datasource_id, datasource)
        if send_message:
            messaging.send_push_notification("adya-scan-update", json.dumps(datasource, cls=models.AlchemyEncoder))
            #RealtimeConnection().send("adya-datasource-update", json.dumps(datasource, cls=models.AlchemyEncoder))

def get_scan_status(datasource):
    if datasource.file_scan_status > 10000 or datasource.user_scan_status > 1 or datasource.group_scan_status > 1:
        return 2 #Failed

    if (datasource.file_scan_status > 0 and datasource.total_file_count == datasource.processed_file_count) and (datasource.user_scan_status == 1 and datasource.total_user_count == datasource.processed_user_count) and (datasource.group_scan_status == 1 and datasource.total_group_count == datasource.processed_group_count):
        return 1 #Complete
    return 0 #In Progress

# since due to external group(group having external user) we need to mark the resource exposure type as External
def update_resource_exposure_type(db_session,domain_id,datasource_id):
    db_session = db_connection().get_session()
    try:
        external_group_subquery = db_session.query(models.DomainGroup.email).filter(and_(models.DomainGroup.datasource_id== datasource_id,
                                                                            models.DomainGroup.domain_id == domain_id,
                                                                            models.DomainGroup.is_external == True )).subquery()
        all_resource_sub_query = db_session.query(models.ResourcePermission.resource_id).distinct(models.ResourcePermission.resource_id).filter(and_(models.ResourcePermission.domain_id == domain_id,
                                                                    models.ResourcePermission.datasource_id == datasource_id,
                                                                    models.ResourcePermission.email.in_(external_group_subquery))).subquery()
        db_session.query(models.Resource).filter(and_(models.Resource.domain_id == domain_id,
                                            models.Resource.datasource_id == datasource_id,
                                            models.Resource.resource_id.in_(all_resource_sub_query))).update({'exposure_type':constants.ResourceExposureType.EXTERNAL},synchronize_session='fetch')
        db_session.commit()
    except Exception as ex:
        print ex