from google.oauth2.credentials import Credentials
import googleapiclient.discovery as discovery
import json,requests
from adya.db.connection import db_connection
from adya.db.models import LoginUser
from oauth2client.service_account import ServiceAccountCredentials
from adya.common.scopeconstants import DRIVE_SCAN_SCOPE,SERVICE_ACCOUNT_SCOPE
import os,httplib2

GOOGLE_TOKEN_URI = 'https://www.googleapis.com/oauth2/v4/token'
GOOGLE_REVOKE_URI = 'https://accounts.google.com/o/oauth2/revoke'
GOOGLE_HEADERS = {'content-type': 'application/x-www-form-urlencoded'}

dir_path = os.path.dirname(os.path.realpath(__file__))

CLIENT_SECRETS_FILE = dir_path + "/client_secrets.json"
SERVICE_ACCOUNT_SECRETS_FILE = dir_path + "/service_account.json"
SERVICE_OBJECT = ServiceAccountCredentials.from_json_keyfile_name(SERVICE_ACCOUNT_SECRETS_FILE,
                                                                SERVICE_ACCOUNT_SCOPE)
def revoke_appaccess(domainid):
    credentials = get_credentials(domain_id=domainid)
    requests.post(GOOGLE_REVOKE_URI,
              params={'token': credentials.refresh_token},
              headers=GOOGLE_HEADERS)


def get_credentials(domain_id,user_email=None):
    credentials =None
    if user_email:
        credentials = get_credentials_object(user_email)
    else:    
        ## we need to pass client_id and client_secret in session to avoid dbcall/file access calls
        db_session = db_connection().get_session()
        user = db_session.query(LoginUser).filter(LoginUser.domain_id == domain_id).first()
        client_id = '675474472628-87uc3fnbmojup9ur2a1b9ie7qfd5i732.apps.googleusercontent.com'
        client_secret = '8DcZ_BxYCd8cBKKEoXdLwwdk'
        credentials = Credentials(None, refresh_token= user.refresh_token,
                                token_uri=GOOGLE_TOKEN_URI,
                                client_id=client_id,
                                client_secret=client_secret)
    return credentials


def get_gdrive_service(domain_id,user_email=None):
    credentials = get_credentials(domain_id,user_email)
    service = discovery.build('drive', 'v3', credentials=credentials)
    return service


def get_gdrive_reports_service(domain_id, credentials = None):
    if not credentials:
        credentials = get_credentials(domain_id)

    service = discovery.build('admin', 'reports_v1', credentials = credentials)
    return service


def get_directory_service(domain_id,credentials=None):
    if not credentials:
        credentials = get_credentials(domain_id)
    service = discovery.build('admin', 'directory_v1', credentials=credentials)
    return service


def get_file_type_from_mimetype(mime_type):
    # replacing '/' with '.' and getting file type
    type = (mime_type.replace('/', '.')).rsplit('.', 1)[1]
    return type


def get_domain_name_from_email(email):
    index_of_strudel_from_last = len(email) - email.index('@')
    domain_name = email[-index_of_strudel_from_last + 1:]
    return domain_name


def get_oauth_service(domain_id,credentials=None):
    if not credentials:
        credentials = get_credentials(domain_id)
    service = discovery.build('oauth2', 'v2', credentials=credentials)
    return service

def check_if_serviceaccount_enabled(emailid):
    profile_info = None
    try:
        credentials = get_credentials_object(emailid)
        drive = discovery.build('drive', 'v3', credentials=credentials)
        profile_info = drive.about().get(fields="user").execute()
        return True
    except Exception as e:
        print e
    return False

def check_if_user_isamdin(credentials,emailid):
    try:
        directory_service = get_directory_service(credentials)
        users = directory_service.users().get(userKey=emailid)
        return True
    except Exception as ex:
        print ex
    return False

def get_credentials_object(emailid):
    credentials = SERVICE_OBJECT.create_delegated(emailid)
    http = credentials.authorize(httplib2.Http())
    credentials.refresh(http)
    return credentials