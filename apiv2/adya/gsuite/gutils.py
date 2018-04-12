from google.oauth2.credentials import Credentials
import googleapiclient.discovery as discovery
import json
import requests
from adya.common.db.connection import db_connection
from adya.common.db.models import LoginUser, Domain
from oauth2client.service_account import ServiceAccountCredentials
from adya.common.constants.scopeconstants import DRIVE_SCAN_SCOPE, SERVICE_ACCOUNT_SCOPE
import os
import httplib2
from adya.common.response_messages import Logger

GOOGLE_TOKEN_URI = 'https://www.googleapis.com/oauth2/v4/token'
GOOGLE_REVOKE_URI = 'https://accounts.google.com/o/oauth2/revoke'
GOOGLE_HEADERS = {'content-type': 'application/x-www-form-urlencoded'}

dir_path = os.path.dirname(os.path.realpath(__file__))

CLIENT_SECRETS_FILE = dir_path + "/client_secrets.json"
CLIENT_JSON_FILE_DATA = json.load(open(CLIENT_SECRETS_FILE))
CLIENT_ID = CLIENT_JSON_FILE_DATA['web']['client_id']
CLIENT_SECRET = CLIENT_JSON_FILE_DATA['web']['client_secret']
SERVICE_ACCOUNT_SECRETS_FILE = dir_path + "/service_account.json"
SERVICE_OBJECT = ServiceAccountCredentials.from_json_keyfile_name(SERVICE_ACCOUNT_SECRETS_FILE,
                                                                  SERVICE_ACCOUNT_SCOPE)
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
        Logger().exception()
    return False


def check_if_user_isamdin(auth_token, user_email=None, db_session = None):
    try:
        directory_service = get_directory_service(auth_token, user_email, db_session)
        users = directory_service.users().get(userKey=user_email).execute()
        return True
    except Exception as ex:
        Logger().exception()
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
