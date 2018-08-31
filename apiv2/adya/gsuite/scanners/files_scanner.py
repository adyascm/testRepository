from __future__ import division  # necessary

from requests_futures.sessions import FuturesSession
import uuid,json,datetime,sys
from sqlalchemy import and_

from adya.gsuite import gutils

from adya.common.utils.response_messages import Logger
from adya.common.constants import constants, urls
from adya.common.db.connection import db_connection
from adya.common.db import models
from adya.common.db.models import DataSource,ResourcePermission,Resource,LoginUser,DomainUser,Application,ApplicationUserAssociation,alchemy_encoder
from adya.common.utils import utils, messaging
from adya.common.email_templates import adya_emails
from adya.common.utils.response_messages import Logger

def query(auth_token, query_params, scanner):
    next_page_token = query_params["nextPageNumber"]
    user_email = query_params["userEmail"]
    owner_email = query_params["ownerEmail"]
    # useremail None means servie account is not verified and we are scaning data for loggedin user only
    drive_service = gutils.get_gdrive_service(auth_token, user_email)
    quotaUser = owner_email[0:41]
    queryString = "'"+ owner_email +"' in owners and trashed=false"
    files = []
    iteration = 0
    next_page_available = True
    while iteration < 10 and next_page_available:
        results = drive_service.files().list(q=queryString, fields="files(id, name, webContentLink, webViewLink, iconLink, "
                        "thumbnailLink, description, lastModifyingUser, mimeType, parents, "
                        "permissions(id, emailAddress, role, displayName, expirationTime, deleted),"
                        "owners,size,createdTime, modifiedTime), "
                        "nextPageToken", pageSize=100, quotaUser= quotaUser, pageToken=next_page_token).execute()
        #print "For user - {} Iteration number - {} and next token - {}".format(owner_email, iteration, next_page_token)

        if results and "files" in results:
            files.extend(results["files"])
        next_page_token = results.get('nextPageToken')
        if not next_page_token:
            next_page_available = False
        iteration += 1
    #print "For user - {} files length - {}".format(owner_email, len(files))
    return {"payload": files, "nextPageNumber": next_page_token, "batchSize": 10}

def process(db_session, auth_token, query_params, scanner_data):
    #start_time = datetime.datetime.utcnow()
    #Logger().info("File processing started at - {}".format(start_time))
    domain_id = query_params["domainId"]
    datasource_id = query_params["dataSourceId"]
    user_email = query_params["userEmail"]
    trusted_domains = (utils.get_trusted_entity_for_domain(db_session, domain_id))['trusted_domains']
    resource_count = 0
    try:
        Logger().info( "Initiating processing of drive resources for files using email: {}".format(user_email))
        resources = scanner_data["entities"]
        resourceList = []
        db_session = db_connection().get_session()
        data_for_permission_table =[]
        external_user_map = {}
        
        for resourcedata in resources:
            resource_count = resource_count + 1
            resource = {}
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
            resource_exposure_type = constants.EntityExposureType.PRIVATE.value
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

                    if email_address:
                        if email_address == resource["resource_owner_id"]:
                            permission_exposure = constants.EntityExposureType.PRIVATE.value
                        elif email_address in external_user_map:
                            permission_exposure = external_user_map[email_address]["member_type"]
                        else:
                            permission_exposure = utils.check_if_external_user(db_session, domain_id, email_address, trusted_domains)

                        if permission_exposure == constants.EntityExposureType.EXTERNAL.value or permission_exposure == constants.EntityExposureType.TRUSTED.value:
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
                                externaluser["member_type"] = permission_exposure
                                external_user_map[email_address]= externaluser

                    #Shared with everyone in domain
                    elif display_name:
                        email_address = "__ANYONE__@"+ display_name
                        permission_exposure = constants.EntityExposureType.DOMAIN.value

                    #  Shared with anyone with link
                    elif permission_id == 'anyoneWithLink':
                        email_address = constants.EntityExposureType.ANYONEWITHLINK.value
                        permission_exposure = constants.EntityExposureType.ANYONEWITHLINK.value

                    #Shared with everyone in public
                    else:
                        email_address = constants.EntityExposureType.PUBLIC.value
                        permission_exposure = constants.EntityExposureType.PUBLIC.value
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
                    resource_exposure_type = utils.get_highest_exposure_type(permission_exposure, resource_exposure_type)
            resource["exposure_type"] = resource_exposure_type
            resource["parent_id"] = resourcedata.get('parents')[0] if resourcedata.get('parents') else None
            resourceList.append(resource)
        
        # db_session.bulk_insert_mappings(Resource, resourceList)
        # db_session.bulk_insert_mappings(ResourcePermission, data_for_permission_table)

        db_session.execute(Resource.__table__.insert().prefix_with("IGNORE").values(resourceList))
        db_session.execute(ResourcePermission.__table__.insert().prefix_with("IGNORE").values(data_for_permission_table))

        #Logger().info("File processing - collected the data in - {}".format(datetime.datetime.utcnow() - start_time))
        #Logger().info("File processing - inserted in resource table in - {}".format(datetime.datetime.utcnow() - start_time))
        #Logger().info("File processing - inserted in permissions table in - {}".format(datetime.datetime.utcnow() - start_time))
        if len(external_user_map)>0:
            db_session.execute(DomainUser.__table__.insert().prefix_with("IGNORE").values(external_user_map.values()))
        db_connection().commit()
        #Logger().info("File processing - committed everything in - {}".format(datetime.datetime.utcnow() - start_time))
        return resource_count
    except Exception as ex:
        Logger().exception("Exception occurred while processing data for drive resources using email: {} - {}".format(user_email, ex))
        db_session.rollback()
        return 0
