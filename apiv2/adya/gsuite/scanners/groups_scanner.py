from __future__ import division  # necessary

from requests_futures.sessions import FuturesSession
import uuid,json,time,datetime,sys
from sqlalchemy import and_

from adya.gsuite import gutils, gsuite_constants

from adya.common.utils.response_messages import Logger
from adya.common.constants import constants, urls
from adya.common.db.connection import db_connection
from adya.common.db import models
from adya.common.db.models import DataSource,DomainUser, DatasourceScanners
from adya.common.utils import utils, messaging
from adya.common.email_templates import adya_emails
from adya.common.utils.response_messages import Logger
from google.auth.exceptions import RefreshError
from googleapiclient.errors import HttpError


def query(auth_token, query_params, scanner):
    next_page_token = query_params["nextPageNumber"]
    directory_service = gutils.get_directory_service(auth_token)
    groups = []

    try:
        results = directory_service.groups().list(customer='my_customer', maxResults=50,
                                                    pageToken=next_page_token).execute()
    except RefreshError as ex:
        Logger().info("Group query : Not able to refresh credentials")
        results = {}
    except HttpError as ex:
        Logger().info("User query : Domain not found error")
        results = {}

    if results and "groups" in results:
        groups = results["groups"]

    next_page_token = results.get('nextPageToken')
    return {"payload": groups, "nextPageNumber": next_page_token}
    
def process(db_session, auth_token, query_params, scanner_data):
    domain_id = query_params["domainId"]
    datasource_id = query_params["dataSourceId"]
    db_session = db_connection().get_session()
    groups_db_insert_data_dic = []

    group_count = 0
    group_key_array = []
    for group_data in scanner_data["entities"]:
        group_count = group_count + 1
        group = {}
        group["datasource_id"] = datasource_id
        group["user_id"] = group_data["id"]
        groupemail = group_data["email"]
        group["email"] = groupemail
        group["full_name"] = group_data["name"]
        #group["direct_members_count"] = group_data["directMembersCount"]
        group["description"] = group_data.get('description')
        group_aliases = group_data.get('aliases')
        if group_aliases:
            group["aliases"] = ",".join(group_aliases)
        group["member_type"] = constants.EntityExposureType.INTERNAL.value
        group["type"] = constants.DirectoryEntityType.GROUP.value

        groups_db_insert_data_dic.append(group)   
        group_key_array.append(groupemail)

    try:
        db_session = db_connection().get_session()
        db_session.bulk_insert_mappings(models.DomainUser, groups_db_insert_data_dic)
        db_connection().commit()
        return group_count
        # query_params = {"domainId": domain_id, "dataSourceId": datasource_id}
        # messaging.trigger_post_event(urls.SCAN_GROUP_MEMBERS, auth_token, query_params, {"groupKeys":group_key_array}, "gsuite")
        # Logger().info("Processed {} google directory groups for domain_id: {}".format(group_count, domain_id))
    except Exception as ex:
        Logger().exception("Exception occurred while processing google directory groups for domain_id: {} - {}".format(domain_id, ex))
        db_session.rollback()
        return 0
        
def post_process(db_session, auth_token, query_params):
    domain_id = query_params["domainId"]
    datasource_id = query_params["dataSourceId"]
    now = datetime.datetime.utcnow()
    groups = db_session.query(DomainUser).filter(and_(DomainUser.datasource_id == datasource_id, DomainUser.type == constants.DirectoryEntityType.GROUP.value)).all()
    for group in groups:
        scanner = DatasourceScanners()
        scanner.datasource_id = datasource_id
        scanner.scanner_type = gsuite_constants.ScannerTypes.MEMBERS.value
        scanner.channel_id = str(uuid.uuid4())
        scanner.user_email = group.email
        scanner.started_at = now
        scanner.in_progress = 1
        db_session.add(scanner)
        db_connection().commit()
        query_params = {'domainId': domain_id, 'dataSourceId': datasource_id, 'scannerId': str(scanner.id), 
                    'groupEmail': group.email}
        messaging.trigger_get_event(urls.SCAN_GSUITE_ENTITIES, auth_token, query_params, "gsuite")