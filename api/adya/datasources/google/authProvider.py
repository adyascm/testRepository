import datetime
import uuid

import httplib2
import requests
import google_auth_oauthlib.flow
import google.oauth2.credentials
from google.oauth2 import service_account
import googleapiclient.discovery
from oauth2client.service_account import ServiceAccountCredentials


from adya.common import constants
from adya.db import accounts
import os

# from adya.db import accounts

dir_path = os.path.dirname(os.path.realpath(__file__))

CLIENT_SECRETS_FILE = dir_path + "/client_secrets.json"
SERVICE_ACCOUNT_SECRETS_FILE = dir_path + "/service_account.json"


API_SERVICE_NAME = "drive"
API_VERSION = 'v2'

SCOPES = ['https://www.googleapis.com/auth/drive ' 
          'https://www.googleapis.com/auth/admin.directory.user ' 
          'https://www.googleapis.com/auth/admin.directory.group ' 
          'https://www.googleapis.com/auth/admin.reports.audit.readonly ' 
          'https://www.googleapis.com/auth/drive ']

SCOPES_VIEW_PROFILE = ['https://www.googleapis.com/auth/drive.readonly']
SERVICE_SCOPE = 'https://www.googleapis.com/auth/drive'


def login_request():
    flow = google_auth_oauthlib.flow.Flow.from_client_secrets_file(
        CLIENT_SECRETS_FILE, scopes=SCOPES_VIEW_PROFILE)
    flow.redirect_uri = constants.API_HOST + "/googleoauthcallback"
    authorization_url, state = flow.authorization_url(
        # Enable offline access so that you can refresh an access token without
        # re-prompting the user for permission. Recommended for web server apps.
        access_type='offline',
        # Enable incremental authorization. Recommended as a best practice.
        include_granted_scopes='true')
    print "authorization_url ", authorization_url
    print "state ", state

    return authorization_url


def login_callback(auth_code, error):
    if error or not auth_code:
        return ""
    flow = google_auth_oauthlib.flow.Flow.from_client_secrets_file(
        CLIENT_SECRETS_FILE, scopes=SCOPES_VIEW_PROFILE)
    flow.redirect_uri = constants.API_HOST + "/googleoauthcallback"

    # Use the authorization server's response to fetch the OAuth 2.0 tokens.
    flow.fetch_token(authorization_response=auth_code)

    # Store credentials in the session.
    # ACTION ITEM: In a production app, you likely want to save these
    #              credentials in a persistent database instead.
    credentials = flow.credentials
    if not credentials:
        return ""

    token = credentials.token
    refresh_token = credentials.refresh_token

    drive = googleapiclient.discovery.build('drive', 'v3', credentials=credentials)
    profile_info = drive.about().get(fields="user").execute()

    login_email = profile_info['user']['emailAddress']
    domain_id = login_email.split('@')[1]
    account_exists = accounts.accounts().get_account(domain_id)
    if account_exists:
        redirect_url = constants.REDIRECT_STATUS + "/AccountExist"
    else:

        domain_name = domain_id.split('.')[0]
        created_time = datetime.datetime.utcnow().isoformat()

        login_users_name = profile_info['user']['displayName'].split(" ")
        login_users_first_name = login_users_name[0]
        login_users_last_name = login_users_name[1]
        authtoken = str(uuid.uuid4())

        if check_for_GSuite(login_email):
            domain_data_json = {
                'domain_id': domain_id, 'domain_name': domain_name, 'create_time': created_time
            }
        else:
             domain_data_json = {
                'domain_id': login_email, 'domain_name':domain_name, 'create_time':created_time
            }

        login_users_data_json = {
            'email': login_email, 'first_name':login_users_first_name, 'last_name':login_users_last_name,
            'authtoken':authtoken, 'domain_id':domain_id, 'refreshtoken':refresh_token, 'created_time': created_time,
            'last_login_time': created_time
        }

        accounts.accounts().create_account(domain_data_json)
        accounts.login().create_login(login_users_data_json)

        redirect_url = constants.REDIRECT_STATUS + "/AccountCreated"

    return redirect_url


def check_for_GSuite(emailid):
    profile_info = None
    service_obj = ServiceAccountCredentials.from_json_keyfile_name(SERVICE_ACCOUNT_SECRETS_FILE, SERVICE_SCOPE)

    credentials = service_obj.create_delegated(emailid)
    http_auth = credentials.authorize(httplib2.Http())
    try:
        drive = googleapiclient.discovery.build('drive', 'v3', credentials=credentials)
        profile_info = drive.about().get(fields="user").execute()
    except Exception as e:
        print e

    return profile_info