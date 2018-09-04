from __future__ import division  # necessary

import random

from requests_futures.sessions import FuturesSession
import uuid,json,time,datetime,sys
from sqlalchemy import and_

from adya.gsuite import gutils, gsuite_constants

from adya.common.utils.response_messages import Logger
from adya.common.constants import constants, urls
from adya.common.db.connection import db_connection
from adya.common.db import models, db_utils
from adya.common.db.models import DataSource,Resource,LoginUser,DomainUser, DatasourceScanners
from adya.common.utils import utils, messaging
from adya.common.email_templates import adya_emails
from adya.common.utils.response_messages import Logger
from google.auth.exceptions import RefreshError
from googleapiclient.errors import HttpError

def query(auth_token, query_params, scanner):
    domain_id = query_params["domainId"]
    next_page_token = query_params["nextPageNumber"]
    directory_service = gutils.get_directory_service(auth_token)
    users = []
    retry = 0
    results = None
    while retry < 6:
        retry += 1
        try:
            results = directory_service.users().list(customer='my_customer', maxResults=20, pageToken=next_page_token,
                                                    orderBy='email').execute()
            break
        except HttpError as ex:
            if ex.resp.status == 403:
                # API limit reached, so retry after few seconds for 5 times
                sleep_secs = min(64, (2 ** retry)) + (random.randint(0, 1000) / 1000.0)
                Logger().warn(
                    "API limit reached while fetching the users in gsuite, will retry after {} secs: {}".format(sleep_secs,
                                                                                                                     next_page_token))
                time.sleep(sleep_secs)
            else:
                Logger().info("User query : Domain not found error")
                results = gutils.create_user_payload_for_nonadmin_nonserviceaccount(auth_token)
                break
        except RefreshError as ex:
            Logger().info("User query : Not able to refresh credentials")
            results = gutils.create_user_payload_for_nonadmin_nonserviceaccount(auth_token)
            break

    if results and "users" in results:
        for user in results["users"]:
            # user_email = user.get("primaryEmail")
            # if user_email.endswith(domain_id):
            users.append(user)
    next_page_token = results.get('nextPageToken')
    return {"payload": users, "nextPageNumber": next_page_token}


def process(db_session, auth_token, query_params, scanner_data):
    domain_id = query_params["domainId"]
    datasource_id = query_params["dataSourceId"]

    user_db_insert_data_dic = []
    db_session = db_connection().get_session()
    scanners_list = []
    scanner_channel_ids = []
    user_count = 0
    now = datetime.datetime.utcnow()
    for user_data in scanner_data["entities"]:
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
        user["user_id"] = user_data["id"]
        user["photo_url"] = user_data.get("thumbnailPhotoUrl")
        aliases = user_data.get("aliases")
        user["customer_id"] = user_data.get("customerId")
        user["type"] = constants.DirectoryEntityType.USER.value
        user["last_login_time"] = user_data["lastLoginTime"][:-1]
        if aliases:
            user["aliases"] = ",".join(aliases)
        user["member_type"] = constants.EntityExposureType.INTERNAL.value
        user_db_insert_data_dic.append(user)

        if user_email.endswith(domain_id):
            channel_id = str(uuid.uuid4())
            file_scanner = {}
            file_scanner["datasource_id"] = datasource_id
            file_scanner["scanner_type"] = gsuite_constants.ScannerTypes.FILES.value
            file_scanner["channel_id"] = channel_id
            file_scanner["user_email"] = user_email
            file_scanner["started_at"] = now
            file_scanner["in_progress"] = 1
            scanners_list.append(file_scanner)

            app_scanner = {}
            app_scanner["datasource_id"] = datasource_id
            app_scanner["scanner_type"] = gsuite_constants.ScannerTypes.APPS.value
            app_scanner["channel_id"] = channel_id
            app_scanner["user_email"] = user_email
            app_scanner["started_at"] = now
            app_scanner["in_progress"] = 1
            scanners_list.append(app_scanner)
            scanner_channel_ids.append(channel_id)


    try:
        db_session.bulk_insert_mappings(models.DomainUser, user_db_insert_data_dic)
        db_session.bulk_insert_mappings(models.DatasourceScanners, scanners_list)
        db_connection().commit()
        
        for scanner in db_session.query(DatasourceScanners).filter(and_(DatasourceScanners.datasource_id == datasource_id, DatasourceScanners.channel_id.in_(scanner_channel_ids))).all():
            Logger().info("AdyaUserScan - Starting for user - {}".format(scanner.user_email))
            file_query_params = {'domainId': domain_id, 'dataSourceId': datasource_id, 'scannerId': str(scanner.id), 
                        'userEmail': scanner.user_email, 'ownerEmail': scanner.user_email}
            messaging.trigger_get_event(urls.SCAN_GSUITE_ENTITIES, auth_token, file_query_params, "gsuite")
            Logger().info("AdyaUserScan - Triggerred the files scanner for user - {}".format(user_email))

        return user_count

    except Exception as ex:
        Logger().exception("Exception occurred while processing google directory users for domain_id: {} - {} ".format(domain_id, ex))
        db_session.rollback()
        return 0