from __future__ import division  # necessary

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
    try:
        results = directory_service.users().list(customer='my_customer', maxResults=10, pageToken=next_page_token,
                                                orderBy='email').execute()
    except RefreshError as ex:
        Logger().info("User query : Not able to refresh credentials")
        results = gutils.create_user_payload_for_nonadmin_nonserviceaccount(auth_token)
    except HttpError as ex:
        Logger().info("User query : Domain not found error")
        results = gutils.create_user_payload_for_nonadmin_nonserviceaccount(auth_token)

    if results and "users" in results:
        for user in results["users"]:
            user_email = user.get("primaryEmail")
            if user_email.endswith(domain_id):
                users.append(user)
    next_page_token = results.get('nextPageToken')
    return {"payload": users, "nextPageNumber": next_page_token}

def process(db_session, auth_token, query_params, scanner_data):
    domain_id = query_params["domainId"]
    datasource_id = query_params["dataSourceId"]

    user_db_insert_data_dic = []
    db_session = db_connection().get_session()
    user_email_list = []
    user_count = 0
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
        user_email_list.append(user_email)
    try:
        db_session.bulk_insert_mappings(models.DomainUser, user_db_insert_data_dic)
        db_connection().commit()
        now = datetime.datetime.utcnow()
        Logger().info("AdyaUserScan - Starting the user iteration")
        for user_email in user_email_list:
            Logger().info("AdyaUserScan - Starting for user - {}".format(user_email))
            file_scanner = DatasourceScanners()
            file_scanner.datasource_id = datasource_id
            file_scanner.scanner_type = gsuite_constants.ScannerTypes.FILES.value
            file_scanner.channel_id = str(uuid.uuid4())
            file_scanner.user_email = user_email
            file_scanner.started_at = now
            file_scanner.in_progress = 1
            db_session.add(file_scanner)
            db_connection().commit()
            Logger().info("AdyaUserScan - Committed the files scanner for user - {}".format(user_email))
            file_query_params = {'domainId': domain_id, 'dataSourceId': datasource_id, 'scannerId': str(file_scanner.id), 
                        'userEmail': user_email, 'ownerEmail': user_email}
            messaging.trigger_get_event(urls.SCAN_GSUITE_ENTITIES, auth_token, file_query_params, "gsuite")
            Logger().info("AdyaUserScan - Triggerred the files scanner for user - {}".format(user_email))

            app_scanner = DatasourceScanners()
            app_scanner.datasource_id = datasource_id
            app_scanner.scanner_type = gsuite_constants.ScannerTypes.APPS.value
            app_scanner.channel_id = str(uuid.uuid4())
            app_scanner.user_email = user_email
            app_scanner.started_at = now
            app_scanner.in_progress = 1
            db_session.add(app_scanner)
            db_connection().commit()
            Logger().info("AdyaUserScan - Committed the app scanner for user - {}".format(user_email))
            app_query_params = {'domainId': domain_id, 'dataSourceId': datasource_id, 'scannerId': str(app_scanner.id), 
                        'userEmail': user_email}
            messaging.trigger_get_event(urls.SCAN_GSUITE_ENTITIES, auth_token, app_query_params, "gsuite")
            Logger().info("AdyaUserScan - Triggerred the app scanner for user - {}".format(user_email))

        #Logger().info("Processed {} google directory users for domain_id: {}".format(user_count, domain_id))
        return user_count

    except Exception as ex:
        Logger().exception("Exception occurred while processing google directory users for domain_id: {} - {} ".format(domain_id, ex))
        db_session.rollback()
        return 0