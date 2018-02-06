import os
import datetime
import uuid

import requests
import google_auth_oauthlib.flow
import google.oauth2.credentials
from google.oauth2 import service_account
import googleapiclient.discovery
from oauth2client.service_account import ServiceAccountCredentials

from adya.common.scopeconstants import SCOPE_DICT
from adya.datasources.google import gutils

from adya.common import constants
from adya.datasources.google.gutils import get_oauth_service, get_gdrive_service
from adya.db.models import Domain, LoginUser, DomainUser
from adya.db.connection import db_connection
from adya.controllers import auth_controller, domain_controller

dir_path = os.path.dirname(os.path.realpath(__file__))

CLIENT_SECRETS_FILE = dir_path + "/client_secrets.json"
SERVICE_ACCOUNT_SECRETS_FILE = dir_path + "/service_account.json"


def oauth_request(scopes):
    scope = SCOPE_DICT["read_only_fullscope"]
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


def oauth_callback(oauth_code, scopes, error):
    redirect_url = ""
    if error or not oauth_code:
        redirect_url = constants.OAUTH_STATUS_URL + "/error?error={}".format(error)
        return redirect_url
    flow = google_auth_oauthlib.flow.Flow.from_client_secrets_file(
        CLIENT_SECRETS_FILE, scopes=scopes)
    flow.redirect_uri = constants.GOOGLE_OAUTH_CALLBACK_URL

    # Use the authorization server's response to fetch the OAuth 2.0 tokens.
    flow.fetch_token(code=oauth_code)

    credentials = flow.credentials
    if not credentials:
        redirect_url = constants.OAUTH_STATUS_URL + "/error?error={}".format("Credentials not found.")
        return redirect_url

    refresh_token = credentials.refresh_token

    service = get_oauth_service(None, credentials)
    profile_info = service.userinfo().get().execute()

    login_email = profile_info['email'].lower()
    domain_id = login_email
    session = db_connection().get_session()
    creation_time = datetime.datetime.utcnow().isoformat()
    existing_user = session.query(LoginUser).filter(LoginUser.email == login_email).first()
    if existing_user:
        auth_token = existing_user.auth_token
        redirect_url = constants.OAUTH_STATUS_URL + "/success?email={}&authtoken={}".format(login_email, auth_token)
    else:
        existing_domain_user = session.query(DomainUser).filter(DomainUser.email == login_email).first()
        if existing_domain_user:
            login_user = auth_controller.create_user(login_email, existing_domain_user.first_name,
                                                     existing_domain_user.last_name, existing_domain_user.domain_id,
                                                     refresh_token, True)
        else:
            domain_name = gutils.get_domain_name_from_email(domain_id)
            is_enterprise_user = False
            if check_for_enterprise_user(login_email):
                domain_id = login_email.split('@')[1]
                is_enterprise_user = True

            domain = domain_controller.create_domain(domain_id, domain_name)
            login_user = auth_controller.create_user(login_email, profile_info['given_name'],
                                                     profile_info['family_name'], domain_id, refresh_token,
                                                     is_enterprise_user)

        redirect_url = constants.OAUTH_STATUS_URL + "/success?email={}&authtoken={}".format(login_email,
                                                                                            login_user.auth_token)
    return redirect_url


def check_for_enterprise_user(emailid):
    profile_info = None
    service_obj = ServiceAccountCredentials.from_json_keyfile_name(SERVICE_ACCOUNT_SECRETS_FILE,
                                                                   SCOPE_DICT['read_drive'])

    credentials = service_obj.create_delegated(emailid)
    try:
        drive = gutils.get_gdrive_service(None, credentials=credentials)
        profile_info = drive.about().get(fields="user").execute()
    except Exception as e:
        print e

    return profile_info
