import csv
import uuid

import datetime
from google.oauth2.credentials import Credentials
import googleapiclient.discovery as discovery
import json
import requests
from sqlalchemy import Boolean

from adya.common.constants import constants, urls
from adya.common.db.connection import db_connection
from adya.common.db.models import LoginUser, Domain, DataSource, get_table, Resource, DomainGroup, DomainUser
from oauth2client.service_account import ServiceAccountCredentials
from adya.common.constants import constants
from adya.common.constants.scopeconstants import DRIVE_SCAN_SCOPE, SERVICE_ACCOUNT_SCOPE, SERVICE_ACCOUNT_READONLY_SCOPE
import os
import httplib2

from adya.common.utils import messaging
from adya.common.utils.response_messages import Logger

GOOGLE_TOKEN_URI = 'https://www.googleapis.com/oauth2/v4/token'
GOOGLE_REVOKE_URI = 'https://accounts.google.com/o/oauth2/revoke'
GOOGLE_HEADERS = {'content-type': 'application/x-www-form-urlencoded'}

dir_path = os.path.dirname(os.path.realpath(__file__))

CLIENT_SECRETS_FILE = dir_path + "/client_secrets.json"
CLIENT_JSON_FILE_DATA = json.load(open(CLIENT_SECRETS_FILE))
CLIENT_ID = CLIENT_JSON_FILE_DATA['web']['client_id']
CLIENT_SECRET = CLIENT_JSON_FILE_DATA['web']['client_secret']
SERVICE_ACCOUNT_SECRETS_FILE = dir_path + "/service_account.json"

GOOGLE_API_SCOPES = json.load(open(dir_path + "/google_api_scopes.json"))

def revoke_appaccess(auth_token, user_email=None, db_session = None):
    credentials = get_credentials(auth_token, user_email, db_session)
    requests.post(GOOGLE_REVOKE_URI,
                  params={'token': credentials.refresh_token},
                  headers=GOOGLE_HEADERS)


def get_credentials(auth_token, user_email=None, db_session = None):
    if not db_session:
        db_session = db_connection().get_session()

    is_serviceaccount_enabled = True if auth_token is None else False
    email = user_email
    refresh_token = None
    token = None

    if auth_token:
        user = db_session.query(LoginUser).filter(LoginUser.auth_token == auth_token).first()
        is_serviceaccount_enabled = user.is_serviceaccount_enabled
        refresh_token = user.refresh_token
        token = user.token
        email = user_email if user_email else user.email

    credentials = None
    if is_serviceaccount_enabled:
        credentials = get_delegated_credentials(email)
    else:
        credentials = Credentials(token, refresh_token=refresh_token,
                                  token_uri=GOOGLE_TOKEN_URI,
                                  client_id=CLIENT_ID,
                                  client_secret=CLIENT_SECRET)
    return credentials


def get_delegated_credentials(emailid):
    SERVICE_OBJECT = None
    if constants.DEPLOYMENT_ENV == "liteapp":
        SERVICE_OBJECT = ServiceAccountCredentials.from_json_keyfile_name(SERVICE_ACCOUNT_SECRETS_FILE, SERVICE_ACCOUNT_READONLY_SCOPE)
    else:
        SERVICE_OBJECT = ServiceAccountCredentials.from_json_keyfile_name(SERVICE_ACCOUNT_SECRETS_FILE, SERVICE_ACCOUNT_SCOPE)
    credentials = SERVICE_OBJECT.create_delegated(emailid)
    http = credentials.authorize(httplib2.Http())
    credentials.refresh(http)
    return credentials


def get_gdrive_service(auth_token, user_email=None, db_session = None):
    credentials = get_credentials(auth_token, user_email, db_session)
    service = discovery.build('drive', 'v3', credentials=credentials)
    return service


def get_gdrive_reports_service(auth_token, user_email=None, db_session = None):
    credentials = get_credentials(auth_token, user_email, db_session)
    service = discovery.build('admin', 'reports_v1', credentials=credentials)
    return service


def get_gdrive_datatransfer_service(auth_token, user_email=None, db_session = None):
    credentials = get_credentials(auth_token, user_email, db_session)
    service = discovery.build('admin', 'datatransfer_v1', credentials=credentials)
    return service


def get_directory_service(auth_token, user_email=None, db_session = None):
    credentials = get_credentials(auth_token, user_email, db_session)
    service = discovery.build('admin', 'directory_v1', credentials=credentials, cache_discovery=False)
    return service


def get_file_type_from_mimetype(mime_type):
    # replacing '/' with '.' and getting file type
    type = (mime_type.replace('/', '.')).rsplit('.', 1)[1]
    return type


def get_domain_name_from_email(email):
    index_of_strudel_from_last = len(email) - email.index('@')
    domain_name = email[-index_of_strudel_from_last + 1:]
    return domain_name


def get_oauth_service(credentials):
    service = discovery.build('oauth2', 'v2', credentials=credentials)
    return service


def check_if_serviceaccount_enabled(emailid):
    profile_info = None
    try:
        credentials = get_delegated_credentials(emailid)
        drive = discovery.build('drive', 'v3', credentials=credentials)
        profile_info = drive.about().get(fields="user").execute()
        return True
    except Exception as e:
        Logger().exception("Exception occurred while checking if service account is enabled")
    return False


def check_if_user_isamdin(auth_token, user_email=None, db_session = None):
    try:
        directory_service = get_directory_service(auth_token, user_email, db_session)
        users = directory_service.users().get(userKey=user_email).execute()
        return True
    except Exception as ex:
        Logger().exception("Exception occurred while checking if user is admin")
    return False


def check_if_external_user(db_session, domain_id, email):
    domain_name = db_session.query(Domain.domain_name).filter(Domain.domain_id == domain_id).first()
    if not '@' in domain_name:
        if email.endswith(domain_name):
            return False
    else:
        if email == domain_name:
            return False
    return True


def get_resource_exposure_type(permission_exposure, highest_exposure):
    if permission_exposure == constants.ResourceExposureType.PUBLIC:
        highest_exposure = constants.ResourceExposureType.PUBLIC
    elif permission_exposure == constants.ResourceExposureType.ANYONEWITHLINK and not highest_exposure == constants.ResourceExposureType.PUBLIC:
        highest_exposure = constants.ResourceExposureType.ANYONEWITHLINK
    elif permission_exposure == constants.ResourceExposureType.EXTERNAL and not (highest_exposure == constants.ResourceExposureType.ANYONEWITHLINK or highest_exposure == constants.ResourceExposureType.PUBLIC):
        highest_exposure = constants.ResourceExposureType.EXTERNAL
    elif permission_exposure == constants.ResourceExposureType.DOMAIN and not (highest_exposure == constants.ResourceExposureType.PUBLIC or highest_exposure == constants.ResourceExposureType.ANYONEWITHLINK or highest_exposure == constants.ResourceExposureType.EXTERNAL):
        highest_exposure = constants.ResourceExposureType.DOMAIN
    elif permission_exposure == constants.ResourceExposureType.INTERNAL and not (highest_exposure == constants.ResourceExposureType.PUBLIC or highest_exposure == constants.ResourceExposureType.ANYONEWITHLINK or highest_exposure == constants.ResourceExposureType.EXTERNAL or highest_exposure == constants.ResourceExposureType.DOMAIN):
        highest_exposure = constants.ResourceExposureType.INTERNAL
    return highest_exposure


def create_datasource(auth_token, db_session, existing_user, payload):
    datasource_id = str(uuid.uuid4())
    datasource = DataSource()
    datasource.domain_id = existing_user.domain_id
    datasource.datasource_id = datasource_id
    datasource.is_dummy_datasource = True if payload.get(
        "isDummyDatasource") else False

    if payload.get("display_name"):
        datasource.display_name = payload["display_name"]
    else:
        datasource.display_name = "Unnamed datasource"
    # we are fixing the datasoure type this can be obtained from the frontend
    datasource.datasource_type = payload ["datasource_type"]
    datasource.creation_time = datetime.datetime.utcnow()
    if datasource.is_dummy_datasource:
        datasource.is_serviceaccount_enabled = False
    else:
        datasource.is_serviceaccount_enabled = existing_user.is_serviceaccount_enabled

    is_admin_user = check_if_user_isamdin(auth_token, existing_user.email, db_session)

    # If service account is enabled, non admin cannot create a data source
    if (datasource.is_serviceaccount_enabled and not is_admin_user):
        raise Exception(
            "Action not allowed, please contact your administrator...")

    if not is_admin_user:
        datasource.user_scan_status = 1
        datasource.group_scan_status = 1

    if is_admin_user and not datasource.is_serviceaccount_enabled:
        # Since it is an admin user, update the domain name in domain table to strip off the full email
        domain_name = get_domain_name_from_email(existing_user.email)
        db_session.query(Domain).filter(Domain.domain_id == existing_user.domain_id).update(
            {"domain_name": domain_name})

    db_session.add(datasource)
    db_connection().commit()
    if datasource.is_dummy_datasource:
        create_dummy_datasource(db_session, existing_user.domain_id, datasource_id)

    else:
        Logger().info("Starting the scan")
        query_params = {"isAdmin": str(is_admin_user), "domainId": datasource.domain_id,
                        "dataSourceId": datasource.datasource_id,
                        "serviceAccountEnabled": str(datasource.is_serviceaccount_enabled)}
        messaging.trigger_post_event(urls.SCAN_START, auth_token, query_params, {}, "gsuite")
        print "Received the response of start scan api"
    return datasource


def create_dummy_datasource(db_session, domain_id, datasource_id):
    file_names = ['resource', 'user', 'group',
                  'directory_structure', 'resource_permission', 'application', 'app_user_association']
    for filename in file_names:
        results = []
        with open(dir_path + "/dummy_datasource/" + filename + ".csv") as csvDataFile:
            csvReader = csv.reader(csvDataFile)
            tablename = get_table(filename)
            columns = tablename.__table__.columns
            firstrow = True
            for row in csvReader:
                if firstrow:
                    firstrow = False
                    continue
                datarow = {}
                for cellvalue, column in zip(row, columns):
                    column_name = column.name
                    column_type = column.type
                    if cellvalue == 'NULL' or cellvalue == '':
                        datarow[column_name] = None
                    elif isinstance(column_type, Boolean):
                        if cellvalue == '0':
                            datarow[column_name] = False
                        else:
                            datarow[column_name] = True
                    elif column_name == 'domain_id':
                        datarow[column_name] = domain_id
                    elif column_name == 'datasource_id':
                        datarow[column_name] = datasource_id
                    else:
                        datarow[column_name] = cellvalue
                results.append(datarow)
        db_session.bulk_insert_mappings(tablename, results)
    db_connection().commit()
    update_datasource_column_count(db_session, domain_id, datasource_id)


def update_datasource_column_count(db_session, domain_id, datasource_id):
    datasouorce = db_session.query(DataSource).filter(DataSource.datasource_id == datasource_id).first()
    filecount = db_session.query(Resource.resource_id).distinct(Resource.resource_id).\
        filter(Resource.datasource_id == datasource_id).count()
    group_count = db_session.query(DomainGroup).distinct(DomainGroup.group_id).\
        filter(DomainGroup.datasource_id == datasource_id).count()
    user_count = db_session.query(DomainUser).distinct(DomainUser.user_id).\
        filter(DomainUser.datasource_id == datasource_id).count()
    datasouorce.total_file_count = filecount
    datasouorce.processed_file_count = filecount
    datasouorce.file_scan_status = user_count

    datasouorce.total_group_count = group_count
    datasouorce.processed_group_count = group_count
    datasouorce.group_scan_status = 1

    datasouorce.total_user_count = user_count
    datasouorce.processed_user_count = user_count
    datasouorce.user_scan_status = 1

    db_session.add(datasouorce)
    db_connection().commit()
