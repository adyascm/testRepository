from __future__ import division  # necessary

from requests_futures.sessions import FuturesSession
import uuid,json,time,datetime,sys
from sqlalchemy import and_

import gutils, incremental_scan

from adya.common.utils.response_messages import Logger
from adya.common.constants import constants, urls
from adya.common.db.connection import db_connection
from adya.common.db import models
from adya.common.db.models import DataSource,ResourcePermission,Resource,LoginUser,DomainUser,ResourceParent,Application,ApplicationUserAssociation,alchemy_encoder
from adya.common.utils import utils, messaging
from adya.common.email_templates import adya_emails
from adya.common.utils.response_messages import Logger


def start_scan(auth_token, domain_id, datasource_id, is_admin, is_service_account_enabled):
    Logger().info("Received the request to start a scan for domain_id: {} datasource_id:{} is_admin:{} is_service_account_enabled: {}".format(
        domain_id, datasource_id, is_admin, is_service_account_enabled))
    query_params = {'domainId': domain_id, 'dataSourceId': datasource_id}

    db_session = db_connection().get_session()
    existing_user = db_session.query(LoginUser).filter(
        LoginUser.auth_token == auth_token).first()

    if is_service_account_enabled == 'True' or is_admin == 'True':
        messaging.trigger_get_event(
            urls.SCAN_DOMAIN_USERS, auth_token, query_params, "gsuite")
        messaging.trigger_get_event(
            urls.SCAN_DOMAIN_GROUPS, auth_token, query_params, "gsuite")
    else:
        query_params["ownerEmail"] = existing_user.email
        messaging.trigger_get_event(
            urls.SCAN_RESOURCES, auth_token, query_params, "gsuite")

# To avoid lambda timeout (5min) we are making another httprequest to process fileId with nextPagetoke
def get_resources(auth_token, domain_id, datasource_id,owner_email, next_page_token=None,user_email=None):
    # here nextPageToken as none means it is first call for resource
    # useremail None means servie account is not verified and we are scaning data for loggedin user only
    Logger().info("Initiating fetching data for drive resources using email: {} next_page_token: {}".format(user_email, next_page_token))
    try:
        drive_service = gutils.get_gdrive_service(auth_token, user_email)
        starttime = time.time()
        session = FuturesSession()
        last_future = None
        quotaUser = None
        quotaUser = owner_email[0:41]
        queryString = "'"+ owner_email +"' in owners and trashed=false"

        Logger().info('got quertyString{}'.format(queryString))
        while True:
            results = drive_service.files().list(q=queryString, fields="files(id, name, webContentLink, webViewLink, iconLink, "
                            "thumbnailLink, description, lastModifyingUser, mimeType, parents, "
                            "permissions(id, emailAddress, role, displayName, expirationTime, deleted),"
                            "owners,size,createdTime, modifiedTime), "
                            "nextPageToken", pageSize=1000, quotaUser= quotaUser, pageToken=next_page_token).execute()
            file_count = len(results['files'])
            
            Logger().info("Received drive resources for {} files using email: {} next_page_token: {}".format(file_count, user_email, next_page_token))

            update_and_get_count(datasource_id, DataSource.total_file_count, file_count, True)

            query_params = {'domainId': domain_id, 'dataSourceId': datasource_id, 'userEmail': (user_email  if user_email else domain_id)}
            sentfile_count =0
            while  sentfile_count < file_count:
                resourcedata = {}
                resourcedata["resources"] = results['files'][sentfile_count:sentfile_count+25]
                messaging.trigger_post_event(urls.SCAN_RESOURCES, auth_token, query_params, resourcedata, "gsuite")
                sentfile_count +=25
            next_page_token = results.get('nextPageToken')
            if next_page_token:
                timediff = time.time() - starttime
                if timediff >= constants.NEXT_CALL_FROM_FILE_ID:
                    query_params = {'domainId': domain_id, 'dataSourceId': datasource_id,'ownerEmail':owner_email, 'nextPageToken': next_page_token}
                    if user_email:
                        query_params["userEmail"] = user_email
                    messaging.trigger_get_event(urls.SCAN_RESOURCES,auth_token, query_params, "gsuite")
                    break
            else:
                #Set the scan - fetch status as complete
                update_and_get_count(datasource_id, DataSource.file_scan_status, 1, True)
                break
    except Exception as ex:
        update_and_get_count(datasource_id, DataSource.file_scan_status, 10001, True)
        Logger().exception("Exception occurred while getting data for drive resources using email: {} next_page_token: {}".
                         format(user_email, next_page_token))


## processing resource data for fileIds
def process_resource_data(domain_id, datasource_id, user_email, resourcedata, is_incremental_scan=0):

    try:
        Logger().info( "Initiating processing of drive resources for files using email: {}".format(user_email))
        resources = resourcedata["resources"]
        resourceList = []
        db_session = db_connection().get_session()

        existing_permissions = []
        is_new_resource = 1
        #If it is called from incremental scan, check if the resource already exist
        if is_incremental_scan and len(resources) == 1:
            file_id = resources[0]["id"]
            Logger().info( "Incremental scan processing request, checking if file - {} exist".format(file_id))
            existing_resource = db_session.query(Resource).filter(and_(Resource.resource_id == file_id, Resource.datasource_id == datasource_id)).first()
            if existing_resource:
                is_new_resource = 0
                existing_permissions = json.dumps(existing_resource.permissions, cls=alchemy_encoder())
                Logger().info( "Resource exist, so deleting the existing permissions and resource, and add again")
                db_session.query(ResourcePermission).filter(and_(ResourcePermission.resource_id == file_id,
                                                                ResourcePermission.datasource_id == datasource_id)).delete()
                db_session.query(Resource).filter(
                    and_(Resource.resource_id == file_id, Resource.datasource_id == datasource_id)).delete()
                db_connection().commit()

        data_for_permission_table =[]
        data_for_parent_table =[]
        external_user_map = {}
        resource_count = 0
        for resourcedata in resources:
            resource_count = resource_count + 1
            resource = {}
            resource["datasource_id"] = datasource_id
            resource_id = resourcedata['id']
            resource["resource_id"] = resource_id
            if resourcedata['name'] == "engineering":
                test = 123

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
                    if is_deleted:
                        continue
                    permission_exposure = constants.ResourceExposureType.PRIVATE
                    if email_address:
                        if gutils.check_if_external_user(db_session, domain_id,email_address):

                            permission_exposure = constants.ResourceExposureType.EXTERNAL
                            ## insert non domain user as External user in db, Domain users will be
                            ## inserted during processing Users
                            if not email_address in external_user_map:

                                externaluser = {}
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
                        elif not email_address == resource["resource_owner_id"]:
                            permission_exposure = constants.ResourceExposureType.INTERNAL
                    #Shared with everyone in domain
                    elif display_name:
                        email_address = "__ANYONE__@"+ domain_id
                        permission_exposure = constants.ResourceExposureType.DOMAIN
                    #Shared with everyone in public
                    else:
                        email_address = constants.ResourceExposureType.PUBLIC
                        permission_exposure = constants.ResourceExposureType.PUBLIC
                    resource_permission = {}
                    resource_permission["datasource_id"] = datasource_id
                    resource_permission["resource_id"] = resource_id
                    resource_permission["email"] = email_address
                    resource_permission["permission_id"] = permission_id
                    resource_permission["permission_type"] = permission['role']
                    resource_permission["exposure_type"] = permission_exposure
                    if expiration_time:
                        resource_permission["expiration_time"] = expiration_time[:-1]
                    resource_permission["is_deleted"] = is_deleted
                    data_for_permission_table.append(resource_permission)
                    resource_exposure_type = get_resource_exposure_type(permission_exposure, resource_exposure_type)
            resource["exposure_type"] = resource_exposure_type
            resource["parent_id"] = resourcedata.get('parents')[0] if resourcedata.get('parents') else None
            resourceList.append(resource)
        
        db_session.bulk_insert_mappings(Resource, resourceList)
        db_session.bulk_insert_mappings(ResourcePermission, data_for_permission_table)
        if len(external_user_map)>0:
            db_session.execute(DomainUser.__table__.insert().prefix_with("IGNORE").values(external_user_map.values()))
        db_connection().commit()

        if is_new_resource == 1:
            update_and_get_count(datasource_id, DataSource.processed_file_count, resource_count, True)
            if is_incremental_scan ==1:
                update_and_get_count(datasource_id, DataSource.total_file_count, resource_count, True, False)

        if is_incremental_scan == 1:
            messaging.send_push_notification("adya-"+datasource_id, 
                json.dumps({"type": "incremental_change", "datasource_id": datasource_id, "email": user_email, "resource": resourceList[0]}))

            #Trigger the policy validation now
            payload = {}
            payload["old_permissions"] = existing_permissions
            payload["resource"] = resourceList[0]
            payload["new_permissions"] = data_for_permission_table
            policy_params = {'dataSourceId': datasource_id}
            messaging.trigger_post_event(urls.POLICIES_VALIDATE_PATH, "Internal-Secret", policy_params, payload)

        Logger().info("Processed drive resources for {} files using email: {}".format(resource_count, user_email))
    except Exception as ex:
        update_and_get_count(datasource_id, DataSource.file_scan_status, 10001, True)
        Logger().exception("Exception occurred while processing data for drive resources using email: {}".format(user_email))


def get_resource_exposure_type(permission_exposure, highest_exposure):
    if permission_exposure == constants.ResourceExposureType.PUBLIC:
        highest_exposure = constants.ResourceExposureType.PUBLIC
    elif permission_exposure == constants.ResourceExposureType.EXTERNAL and not highest_exposure == constants.ResourceExposureType.PUBLIC:
        highest_exposure = constants.ResourceExposureType.EXTERNAL
    elif permission_exposure == constants.ResourceExposureType.DOMAIN and not (highest_exposure == constants.ResourceExposureType.PUBLIC or highest_exposure == constants.ResourceExposureType.EXTERNAL):
        highest_exposure = constants.ResourceExposureType.DOMAIN
    elif permission_exposure == constants.ResourceExposureType.INTERNAL and not (highest_exposure == constants.ResourceExposureType.PUBLIC or highest_exposure == constants.ResourceExposureType.EXTERNAL or highest_exposure == constants.ResourceExposureType.DOMAIN):
        highest_exposure = constants.ResourceExposureType.INTERNAL
    return highest_exposure

def get_permission_for_fileId(auth_token,user_email, batch_request_file_id_list, domain_id, datasource_id, session):
    requestdata = {"fileIds": batch_request_file_id_list}
    url = urls.SCAN_PERMISSIONS + "?domainId=" + \
                domain_id + "&dataSourceId=" + datasource_id
    if user_email:
        url = url +"&userEmail=" + user_email
    utils.post_call_with_authorization_header(session,url,auth_token,requestdata).result()
    processed_file_count = len(batch_request_file_id_list)
    update_and_get_count(datasource_id, DataSource.processed_file_count, processed_file_count, True)


def get_parent_for_user(auth_token, domain_id, datasource_id,user_email):
    Logger().info("Started getting parents data" + str(user_email))
    db_session = db_connection().get_session()
    useremail_resources_map = {}
    if user_email:
        resources_data = db_session.query(Resource.resource_id).distinct(Resource.resource_id)\
                               .filter(and_(Resource.datasource_id == datasource_id,Resource.resource_id != constants.ROOT)).all()
        update_and_get_count(datasource_id,DataSource.user_count_for_parent,1)
        useremail_resources_map[user_email] = []
        for data in resources_data:
            useremail_resources_map[user_email].append(data.resource_id)
    else:
        alluserquery = db_session.query(DomainUser.email).filter(and_(DomainUser.domain_id==domain_id,\
                               DomainUser.datasource_id == datasource_id, DomainUser.member_type == constants.UserMemberType.INTERNAL)).subquery()
        queried_data = db_session.query(ResourcePermission.resource_id,ResourcePermission.email)\
                               .filter(and_(ResourcePermission.domain_id==domain_id,\
                               ResourcePermission.datasource_id == datasource_id,\
                               ResourcePermission.email.in_(alluserquery))).all()
        unique_email_id_count = db_session.query(ResourcePermission.email).distinct(ResourcePermission.email)\
                          .filter(and_(ResourcePermission.datasource_id == datasource_id,ResourcePermission.email.in_(alluserquery))).count()
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
            url = urls.SCAN_PARENTS + "?domainId=" + \
                        domain_id + "&dataSourceId=" + datasource_id + "&userEmail=" + email
        else:
            url = urls.SCAN_PARENTS + "?domainId=" + \
                        domain_id + "&dataSourceId=" + datasource_id
        last_result = utils.post_call_with_authorization_header(session,url,auth_token,requestdata)
    if last_result:
        last_result.result()

def getDomainUsers(datasource_id, auth_token, domain_id, next_page_token):
    Logger().info("Initiating fetching of google directory users using for domain_id: {} next_page_token: {}".format(domain_id, next_page_token))
    directory_service = gutils.get_directory_service(auth_token)
    starttime = time.time()
    while True:
        try:
            results = directory_service.users().list(customer='my_customer', maxResults=500, pageToken=next_page_token,
                                                     orderBy='email').execute()

            data = {"usersResponseData": results["users"]}
            user_count = len(results["users"])
            Logger().info("Received {} google directory users for domain_id: {} using next_page_token: {}".format(user_count, domain_id, next_page_token))
            # no need to send user count to ui , so passing send_message flag as false
            update_and_get_count(datasource_id, DataSource.total_user_count, user_count, False)
            query_params = {"domainId": domain_id, "dataSourceId": datasource_id }
            messaging.trigger_post_event(urls.SCAN_DOMAIN_USERS, auth_token, query_params, data, "gsuite")
            next_page_token = results.get('nextPageToken')
            if next_page_token:
                timediff = time.time() - starttime
                if timediff >= constants.NEXT_CALL_FROM_FILE_ID:
                    query_params = {"domainId": domain_id, "dataSourceId": datasource_id, "nextPageToken": next_page_token}
                    messaging.trigger_get_event(urls.SCAN_DOMAIN_USERS, auth_token, query_params, "gsuite")
                    break
            else:
                #Set the scan - fetch status as complete
                update_and_get_count(datasource_id, DataSource.user_scan_status, 1, True)
                break
        except Exception as ex:
            update_and_get_count(datasource_id, DataSource.user_scan_status, 2, True)
            Logger().exception("Exception occurred while getting google directory users for domain_id: {} next_page_token: {}".format(domain_id, next_page_token))
            break


def processUsers(auth_token,users_data, datasource_id, domain_id):
    Logger().info("Initiating processing of google directory users for domain_id: {}".format(domain_id))

    user_db_insert_data_dic = []
    db_session = db_connection().get_session()
    datasource = db_session.query(DataSource).filter(DataSource.datasource_id == datasource_id).first()
    logged_in_user = db_session.query(LoginUser).filter(LoginUser.auth_token== auth_token).first()
    session = FuturesSession()
    user_email_list = []
    user_count = 0
    for user_data in users_data:
        user_count = user_count + 1
        user_email = user_data.get("primaryEmail")
        names = user_data["name"]
        user = {}
        user["datasource_id"] = datasource_id
        user["email"] = user_email
        user["first_name"] = names.get("givenName")
        user["last_name"] = names.get("familyName")
        user["full_name"] = names.get("fullName")
        user["is_admin"] = user_data.get("isAdmin")
        user["creation_time"] = user_data["creationTime"][:-1]
        user["is_suspended"] = user_data.get("suspended")
        user["primary_email"] = user_email
        user["user_id"] = user_data["id"]
        user["photo_url"] = user_data.get("thumbnailPhotoUrl")
        aliases = user_data.get("aliases")
        user["customer_id"] = user_data.get("customerId")

        if aliases:
            user["aliases"] = ",".join(aliases)
        user["member_type"] = constants.UserMemberType.INTERNAL
        user_db_insert_data_dic.append(user)
        user_email_list.append(user_email)
    try:
        db_session.bulk_insert_mappings(models.DomainUser, user_db_insert_data_dic)
        db_connection().commit()
        update_and_get_count(datasource_id, DataSource.processed_user_count, user_count, True)

        Logger().info("Processed {} google directory users for domain_id: {}".format(user_count, domain_id))

    except Exception as ex:
        update_and_get_count(datasource_id, DataSource.user_scan_status, 2, True)
        Logger().exception("Exception occurred while processing google directory users for domain_id: {}".format(domain_id))

    lastresult =None

    resource_usersList = user_email_list
    if not datasource.is_serviceaccount_enabled:
        resource_usersList = [logged_in_user.email]

    Logger().info("Google service account is enabled, starting to fetch files for each processed user")
    for user_email in resource_usersList:
        query_params = {'domainId': domain_id, 'dataSourceId': datasource_id,'ownerEmail':user_email,'userEmail': user_email if datasource.is_serviceaccount_enabled else ""}
        messaging.trigger_get_event(urls.SCAN_RESOURCES,auth_token, query_params, "gsuite")

    #Scan apps only for service account
    if datasource.is_serviceaccount_enabled:
        Logger().info("Getting all users app and its scope")
        query_params = {'domainId': domain_id, 'dataSourceId': datasource_id}
        userEmailList = {}
        userEmailList["userEmailList"] = user_email_list
        messaging.trigger_post_event(urls.SCAN_USERS_APP, auth_token, query_params, userEmailList, "gsuite")


def getDomainGroups(datasource_id, auth_token, domain_id, next_page_token):
    Logger().info("Initiating fetching of google directory groups using for domain_id: {} next_page_token: {}".format(domain_id, next_page_token))
    directory_service = gutils.get_directory_service(auth_token)
    starttime = time.time()
    while True:
        try:
            results = directory_service.groups().list(customer='my_customer', maxResults=500,
                                                      pageToken=next_page_token).execute()

            if not "groups" in results:
                Logger().info("Domain groups result returned is {}".format(results))
                Logger().warn("Groups not found, hence not processing domain groups")
                return

            group_count = len(results["groups"])
            Logger().info("Received {} google directory groups for domain_id: {} using next_page_token: {}".format(group_count, domain_id, next_page_token))
            
            update_and_get_count(datasource_id, DataSource.total_group_count, group_count, True)
            data = {"groupsResponseData": results["groups"]}

            query_params = {"domainId": domain_id, "dataSourceId": datasource_id}
            messaging.trigger_post_event(urls.SCAN_DOMAIN_GROUPS, auth_token, query_params, data, "gsuite")
            next_page_token = results.get('nextPageToken')
            if next_page_token:
                timediff = time.time() - starttime
                if timediff >= constants.NEXT_CALL_FROM_FILE_ID:
                    query_params = {"domainId": domain_id, "dataSourceId": datasource_id, "nextPageToken": next_page_token}
                    messaging.trigger_get_event(urls.SCAN_DOMAIN_GROUPS, auth_token, query_params, "gsuite")
                    break
            else:
                #Set the scan - fetch status as complete
                update_and_get_count(datasource_id, DataSource.group_scan_status, 1, True)
                break
        except Exception as ex:
            update_and_get_count(datasource_id, DataSource.group_scan_status, 2, True)
            Logger().exception("Exception occurred while getting google directory groups for domain_id: {} next_page_token: {}".format(domain_id, next_page_token))
            break


def processGroups(groups_data, datasource_id, domain_id, auth_token):
    Logger().info("Initiating processing of google directory groups for domain_id: {}".format(domain_id))
    groups_db_insert_data_dic = []

    group_count = 0
    group_key_array = []
    for group_data in groups_data:
        group_count = group_count + 1
        group = {}
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
        db_connection().commit()
        
        query_params = {"domainId": domain_id, "dataSourceId": datasource_id}
        messaging.trigger_post_event(urls.SCAN_GROUP_MEMBERS, auth_token, query_params, {"groupKeys":group_key_array}, "gsuite")
        Logger().info("Processed {} google directory groups for domain_id: {}".format(group_count, domain_id))
    except Exception as ex:
        update_and_get_count(datasource_id, DataSource.group_scan_status, 2, True)
        Logger().exception("Exception occurred while processing google directory groups for domain_id: {}".format(domain_id))

def get_group_data(auth_token, domain_id,datasource_id,group_keys):
    processed_group_count =0
    total_no_of_group = len(group_keys)
    while processed_group_count <= total_no_of_group:
        hundred_group = group_keys[processed_group_count:processed_group_count+100]
        processed_group_count +=100
        group_class = GroupData(auth_token, domain_id,datasource_id,hundred_group)
        group_class.get_group_members()


class GroupData():

    def __init__(self, auth_token, domain_id, datasource_id,group_keys):
        self.domain_id = domain_id
        self.datasource_id = datasource_id
        self.group_keys = group_keys
        self.batch_length = len(group_keys)
        self.db_session = db_connection().get_session()
        self.auth_token = auth_token

    def group_data_callback(self,request_id, response, exception):
        request_id = int(request_id) 
        group_key = self.group_keys[request_id - 1]
        
        if exception :
            update_and_get_count(self.datasource_id, DataSource.group_scan_status, 2, True)
            Logger().exception("Exception occurred while processing google directory group members for domain_id: {} group_key: {}".format(self.domain_id, group_key))
            return
        
        try:
            update_and_get_count(self.datasource_id, DataSource.processed_group_count, 1, True)
            if response.get('members'):
                is_external = False
                for group_data in response['members']:
                    member_type = group_data.get("type")
                    member_id = group_data.get("id")
                    member_role = group_data.get("role")
                    if member_type == "CUSTOMER":
                        self.db_session.query(models.DomainGroup).filter(
                            and_(models.DomainGroup.datasource_id == self.datasource_id,
                                models.DomainGroup.email == group_key)).update({'include_all_user': True})
                        continue
                    else:
                        group = models.DirectoryStructure()
                        group.datasource_id = self.datasource_id
                        group.member_email = group_data["email"]
                        group.parent_email = group_key
                        group.member_id = member_id
                        group.member_role = member_role
                        group.member_type = member_type

                        if not is_external and gutils.check_if_external_user(self.db_session, self.domain_id, group.member_email):
                            is_external = True
                            self.db_session.query(models.DomainGroup).filter(and_(models.DomainGroup.datasource_id == self.datasource_id,
                                                                            models.DomainGroup.email ==  group_key)).update({"is_external":is_external})
                        self.db_session.add(group)
        
            if self.batch_length == request_id:
                db_connection().commit()
                
        except Exception as ex:
            update_and_get_count(self.datasource_id, DataSource.group_scan_status, 2, True)
            Logger().exception("Exception occurred while processing google directory group members for domain_id: {} group_key: {}".format(self.domain_id, group_key))
            return

    def get_group_members(self):
        directory_service = gutils.get_directory_service(self.auth_token)
        batch = directory_service.new_batch_http_request(callback=self.group_data_callback)
        for group_key in self.group_keys:
            group_member_data = directory_service.members().list(groupKey=group_key)
            batch.add(group_member_data)
        batch.execute()


def update_and_get_count(datasource_id, column_name, column_value, send_message=False, send_email=True):
    db_session = db_connection().get_session()
    rows_updated = 0
    try:
        rows_updated = db_session.query(DataSource).filter(DataSource.datasource_id == datasource_id). \
            update({column_name: column_name + column_value})
        db_connection().commit()
    except Exception as ex:
        Logger().exception("Exception occurred while updating the scan status for the datasource.")
    if rows_updated == 1:
        datasource = db_session.query(DataSource).filter(and_(DataSource.datasource_id == datasource_id, DataSource.is_async_delete == False)).first()
        if send_message:
            messaging.send_push_notification("adya-scan-update", json.dumps(datasource, cls=alchemy_encoder()))
        if get_scan_status(datasource) == 1:
            messaging.send_push_notification("adya-scan-update", json.dumps(datasource, cls=alchemy_encoder()))
            update_resource_exposure_type(db_session,datasource.domain_id,datasource_id)
            if send_email:
                adya_emails.send_gdrive_scan_completed_email(datasource)

            if constants.DEPLOYMENT_ENV != "local":
                query_params = {'domainId': datasource.domain_id, 'dataSourceId': datasource_id}
                Logger().info("Trying for push notification subscription for domain_id: {} datasource_id: {}".format(datasource.domain_id, datasource_id))
                messaging.trigger_post_event(urls.SUBSCRIBE_GDRIVE_NOTIFICATIONS_PATH, "Internal-Secret",
                                             query_params, {}, "gsuite")

def get_scan_status(datasource):
    if datasource.file_scan_status > 10000 or datasource.user_scan_status > 1 or datasource.group_scan_status > 1:
        return 2 #Failed

    file_status = 1
    if datasource.is_serviceaccount_enabled:
        file_status = datasource.total_user_count
    if (datasource.file_scan_status >= file_status and datasource.total_file_count == datasource.processed_file_count) and (datasource.user_scan_status == 1 and datasource.total_user_count == datasource.processed_user_count) and (datasource.group_scan_status == 1 and datasource.total_group_count == datasource.processed_group_count):
        return 1 #Complete
    return 0 #In Progress

# since due to external group(group having external user) we need to mark the resource exposure type as External
def update_resource_exposure_type(db_session,domain_id,datasource_id):
    db_session = db_connection().get_session()
    try:
        external_group_subquery = db_session.query(models.DomainGroup.email).filter(and_(models.DomainGroup.datasource_id== datasource_id,
                                                                            models.DomainGroup.is_external == True )).subquery()
        all_resource_sub_query = db_session.query(models.ResourcePermission.resource_id).distinct(models.ResourcePermission.resource_id).filter(and_(models.ResourcePermission.datasource_id == datasource_id,
                                                                    models.ResourcePermission.email.in_(external_group_subquery))).subquery()
        db_session.query(models.Resource).filter(and_(models.Resource.datasource_id == datasource_id,
                                            models.Resource.resource_id.in_(all_resource_sub_query))).update({'exposure_type':constants.ResourceExposureType.EXTERNAL},synchronize_session='fetch')
        db_connection().commit()
    except Exception as ex:
        Logger().exception()

def get_all_user_app(auth_token,domain_id,datasource_id,user_email_list):

    process_user_count =0
    total_user = len(user_email_list)
    while process_user_count<total_user:
        getuserappobject = GetAllUserAppAndScope(auth_token,domain_id,datasource_id,
                        user_email_list[process_user_count:process_user_count+100])
        getuserappobject.get_user_apps()
        process_user_count +=100


class GetAllUserAppAndScope():

    def __init__(self,auth_token,domain_id,datasource_id,user_email_list):
        self.auth_token = auth_token
        self.domain_id = domain_id
        self.datasource_id = datasource_id
        self.user_email_list = user_email_list
        self.db_session = db_connection().get_session()
        self.length = len(user_email_list)
        self.applicationassociations =[]
        self.applications ={}
    def app_data_callback(self,request_id, response, exception):
        request_id = int(request_id) 
        user_email = self.user_email_list[request_id - 1]
        if response.get("items"):
            for app in response["items"]:
                application = Application()
                application.datasource_id= self.datasource_id
                application.client_id = app["clientId"]
                application.display_text = app.get("displayText")
                application.anonymous = app.get("anonymous")
                association_table =  {}
                association_table["client_id"] = app["clientId"]
                association_table["user_email"] = user_email
                association_table["datasource_id"] = self.datasource_id
                self.applicationassociations.append(association_table)
                max_score = 0
                scopes = app["scopes"]
                for scope in scopes:
                    if scope in gutils.GOOGLE_API_SCOPES:
                        score = gutils.GOOGLE_API_SCOPES[scope]['score']
                        if score > max_score:
                            max_score = score
                #sum_squares = sum([ x**2 for x in scores ])
                #application.score = math.sqrt( sum_squares / len(scores) )
                application.score = max_score
                application.scopes = ','.join(scopes)
                if not app["clientId"] in self.applications:
                    self.applications[app["clientId"]] ={}
                    self.db_session.add(application)

        if request_id == self.length:
            db_connection().commit()
            self.db_session.bulk_insert_mappings(ApplicationUserAssociation,self.applicationassociations)
            db_connection().commit()
                

    def get_user_apps(self):
        directory_service = gutils.get_directory_service(self.auth_token)
        batch = directory_service.new_batch_http_request(callback=self.app_data_callback)
        for user_key in self.user_email_list:
            user_app_data = directory_service.tokens().list(userKey=user_key)
            batch.add(user_app_data)
        batch.execute()