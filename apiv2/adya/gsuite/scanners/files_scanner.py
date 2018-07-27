from __future__ import division  # necessary

from requests_futures.sessions import FuturesSession
import uuid,json,datetime,sys
from sqlalchemy import and_

from adya.gsuite import gutils
from adya.gsuite.mappers.resource import GsuiteResource, GsuitePermission

from adya.common.utils.response_messages import Logger
from adya.common.constants import constants, urls
from adya.common.db.connection import db_connection
from adya.common.db import models, storage_db
from adya.common.db.models import DomainUser
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
    results = drive_service.files().list(q=queryString, fields="files(id, name, webContentLink, webViewLink, iconLink, "
                    "thumbnailLink, description, lastModifyingUser, mimeType, parents, "
                    "permissions(id, emailAddress, role, displayName, expirationTime, deleted),"
                    "owners,size,createdTime, modifiedTime), "
                    "nextPageToken", pageSize=100, quotaUser= quotaUser, pageToken=next_page_token).execute()
    if results and "files" in results:
        files = results["files"]

    next_page_token = results.get('nextPageToken')
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
        resources_data = scanner_data["entities"]
        resources = []
        permissions =[]
        external_user_map = {}
        
        for resource_data in resources_data:
            resource_count = resource_count + 1
            resource_mapper = GsuiteResource(domain_id, datasource_id, resource_data, external_user_map, trusted_domains)
            resource = resource_mapper.parse()
            permissions.extend(resource_mapper.get_permissions())
            resources.append(resource)
        
        storage_db.storage_db().add_resources(domain_id, resources)
        storage_db.storage_db().add_permissions(domain_id, permissions)
        if len(external_user_map)>0:
            db_session.execute(DomainUser.__table__.insert().prefix_with("IGNORE").values(external_user_map.values()))
        db_connection().commit()
        #Logger().info("File processing - committed everything in - {}".format(datetime.datetime.utcnow() - start_time))
        return resource_count
    except Exception as ex:
        Logger().exception("Exception occurred while processing data for drive resources using email: {} - {}".format(user_email, ex))
        db_session.rollback()
        return 0
