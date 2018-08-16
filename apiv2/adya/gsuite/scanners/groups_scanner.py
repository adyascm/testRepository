from __future__ import division  # necessary

import random

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
    retry = 0
    results = {}
    while retry < 6:
        retry += 1
        try:
            results = directory_service.groups().list(customer='my_customer', maxResults=25,
                                                        pageToken=next_page_token).execute()
            break
        except HttpError as ex:
            if ex.resp.status == 403:
                # API limit reached, so retry after few seconds for 5 times
                sleep_secs = min(64, (2 ** retry)) + (random.randint(0, 1000) / 1000.0)
                Logger().warn(
                    "API limit reached while fetching the groups in gsuite, will retry after {} secs: {}".format(sleep_secs,
                                                                                                                     next_page_token))
                time.sleep(sleep_secs)
            else:
                Logger().info("groups query : Domain not found error")
                break
        except RefreshError as ex:
            Logger().info("Group query : Not able to refresh credentials")
            break

    if results and "groups" in results:
        groups = results["groups"]

    next_page_token = results.get('nextPageToken')
    return {"payload": groups, "nextPageNumber": next_page_token}


def process(db_session, auth_token, query_params, scanner_data):
    domain_id = query_params["domainId"]
    datasource_id = query_params["dataSourceId"]
    groups_db_insert_data_dic = []
    group_email_list = []
    scanners_list = []
    scanner_channel_ids = []
    group_count = 0
    now = datetime.datetime.utcnow()
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
        group_email_list.append(groupemail)
        groups_db_insert_data_dic.append(group)   

        channel_id = str(uuid.uuid4())
        scanner = {}
        scanner["datasource_id"] = datasource_id
        scanner["scanner_type"] = gsuite_constants.ScannerTypes.MEMBERS.value
        scanner["channel_id"] = channel_id
        scanner["user_email"] = groupemail
        scanner["started_at"] = now
        scanner["in_progress"] = 1
        scanners_list.append(scanner)
        scanner_channel_ids.append(channel_id)

    try:
        db_session.bulk_insert_mappings(models.DomainUser, groups_db_insert_data_dic)
        db_session.bulk_insert_mappings(models.DatasourceScanners, scanners_list)
        db_connection().commit()

        
        for scanner in db_session.query(DatasourceScanners).filter(and_(DatasourceScanners.datasource_id == datasource_id, DatasourceScanners.channel_id.in_(scanner_channel_ids))).all():
            query_params = {'domainId': domain_id, 'dataSourceId': datasource_id, 'scannerId': str(scanner.id), 
                        'groupEmail': scanner.user_email}
            messaging.trigger_get_event(urls.SCAN_GSUITE_ENTITIES, auth_token, query_params, "gsuite")

        return group_count
    except Exception as ex:
        Logger().exception("Exception occurred while processing google directory groups for domain_id: {} - {}".format(domain_id, ex))
        db_session.rollback()
        return 0