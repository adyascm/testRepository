import datetime
import uuid

import requests
import google_auth_oauthlib.flow
import google.oauth2.credentials
from google.oauth2 import service_account
import googleapiclient.discovery
from oauth2client.service_account import ServiceAccountCredentials

from adya.common.constants import SCOPE_DICT
from adya.datasources.google import gutils

from adya.common import constants
from adya.datasources.google.gutils import get_oauth_service, get_gdrive_service
from adya.db.models import Domain, LoginUser
from adya.db.connection import db_connection
import os

# from adya.db import accounts

dir_path = os.path.dirname(os.path.realpath(__file__))

CLIENT_SECRETS_FILE = dir_path + "/client_secrets.json"
SERVICE_ACCOUNT_SECRETS_FILE = dir_path + "/service_account.json"

API_SERVICE_NAME = "drive"
API_VERSION = 'v2'


def login_request(scopes):
    scope = SCOPE_DICT["profile_view"]
    if scopes in SCOPE_DICT:
        scope = SCOPE_DICT[scopes]
    flow = google_auth_oauthlib.flow.Flow.from_client_secrets_file(
        CLIENT_SECRETS_FILE, scopes=scope)
    flow.redirect_uri = constants.GOOGLE_OAUTH_CALLBACK_URL
    authorization_url, state = flow.authorization_url(
        # Enable offline access so that you can refresh an access token without
        # re-prompting the user for permission. Recommended for web server apps.
        access_type='offline',
        # Enable incremental authorization. Recommended as a best practice.
        include_granted_scopes='true')
    print "authorization_url ", authorization_url
    print "state ", state

    return authorization_url



def login_callback(auth_url, scopes, error):
    redirect_url = ""
    if error or not auth_url:
        redirect_url = constants.OAUTH_STATUS_URL + "/error?error={}".format(error)
        return redirect_url
    flow = google_auth_oauthlib.flow.Flow.from_client_secrets_file(
        CLIENT_SECRETS_FILE, scopes=scopes)
    flow.redirect_uri = constants.GOOGLE_OAUTH_CALLBACK_URL

    # Use the authorization server's response to fetch the OAuth 2.0 tokens.
    flow.fetch_token(authorization_response=auth_url)

    credentials = flow.credentials
    if not credentials:
        redirect_url = constants.OAUTH_STATUS_URL + "/error?error={}".format("Credentials not found.")
        return redirect_url

    refresh_token = credentials.refresh_token

    service =get_oauth_service(credentials)
    profile_info = service.userinfo().get().execute()
    print profile_info
    login_email = profile_info['email'].lower()
    domain_id = login_email
    session = db_connection().get_session()

    existing_user = session.query(LoginUser).filter(LoginUser.email == login_email).first()
    if existing_user:
        auth_token = existing_user.auth_token
        redirect_url = constants.OAUTH_STATUS_URL + "/success?email={}&authtoken={}".format(login_email, auth_token)
    else:

        domain_name = domain_id.split('.')[0]
        creation_time = datetime.datetime.utcnow().isoformat()
        auth_token = str(uuid.uuid4())
        is_enterprise_user = False

        if check_for_enterprise_user(login_email):
            domain_id = login_email.split('@')[1]
            is_enterprise_user = True

        domain = Domain()
        domain.domain_id = domain_id
        domain.domain_name = domain_name
        domain.creation_time = creation_time

        login_user = LoginUser()
        login_user.email = login_email
        login_user.first_name = profile_info['given_name']
        login_user.last_name = profile_info['family_name']
        login_user.auth_token = auth_token
        login_user.domain = domain
        login_user.refresh_token = refresh_token
        login_user.is_enterprise_user = is_enterprise_user
        login_user.creation_time = creation_time
        login_user.last_login_time = creation_time

        session.add(domain)
        session.add(login_user)
        session.commit()

        redirect_url = constants.OAUTH_STATUS_URL + "/success?email={}&authtoken={}".format(login_email, auth_token)
    return redirect_url


def check_for_enterprise_user(emailid):
    profile_info = None
    service_obj = ServiceAccountCredentials.from_json_keyfile_name(SERVICE_ACCOUNT_SECRETS_FILE, SCOPE_DICT['read_drive'])

    credentials = service_obj.create_delegated(emailid)
    try:
        drive = gutils.get_gdrive_service(credentials)
        profile_info = drive.about().get(fields="user").execute()
    except Exception as e:
        print e

    return profile_info




