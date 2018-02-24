import os
import datetime
import uuid

import requests
import google_auth_oauthlib.flow
import google.oauth2.credentials
from google.oauth2 import service_account
import googleapiclient.discovery
from oauth2client.service_account import ServiceAccountCredentials

from adya.common.scopeconstants import LOGIN_SCOPE, DRIVE_SCAN_SCOPE, SCOPE_DICT
from adya.datasources.google import gutils

from adya.common import constants
from adya.datasources.google.gutils import get_oauth_service, get_gdrive_service
from adya.db.models import Domain, LoginUser, DomainUser
from adya.db.connection import db_connection
from adya.controllers import auth_controller, domain_controller


def oauth_request(scopes):
    scope = LOGIN_SCOPE
    if scopes in SCOPE_DICT:
        scope = SCOPE_DICT[scopes]
    state = scopes
    flow = google_auth_oauthlib.flow.Flow.from_client_secrets_file(
        gutils.CLIENT_SECRETS_FILE, scopes=scope)
    flow.redirect_uri = constants.GOOGLE_OAUTH_CALLBACK_URL
    authorization_url, state = flow.authorization_url(
        # Enable offline access so that you can refresh an access token without
        # re-prompting the user for permission. Recommended for web server apps.
        access_type='offline',
        # Enable incremental authorization. Recommended as a best practice.
        include_granted_scopes='true',state=state)

    return authorization_url


def oauth_callback(oauth_code, scopes,state, error):
    redirect_url = ""
    if error or not oauth_code:
        redirect_url = constants.OAUTH_STATUS_URL + "/error?error={}".format(error)
        return redirect_url
    flow = google_auth_oauthlib.flow.Flow.from_client_secrets_file(
        gutils.CLIENT_SECRETS_FILE, scopes=scopes)
    flow.redirect_uri = constants.GOOGLE_OAUTH_CALLBACK_URL
    # in state we are passing the login scope name
    scope_name = state
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
    db_session = db_connection().get_session()
    creation_time = datetime.datetime.utcnow().isoformat()
    existing_user = auth_controller.get_user(login_email, db_session)
    if existing_user:
        auth_token = existing_user.auth_token
        if refresh_token:
            auth_controller.update_user_refresh_token(login_email, refresh_token, db_session)
            auth_controller.update_user_scope_name(login_email,scope_name,db_session)
        redirect_url = constants.OAUTH_STATUS_URL + "/success?email={}&authtoken={}".format(login_email, auth_token)
    else:
        existing_domain_user = db_session.query(DomainUser).filter(DomainUser.email == login_email).first()
        if existing_domain_user:
            login_user = auth_controller.create_user(login_email, existing_domain_user.first_name,
                                                     existing_domain_user.last_name, existing_domain_user.domain_id,
                                                     refresh_token, True,scope_name)
        else:
            # here we need to think about gmail.com.
            domain_name = gutils.get_domain_name_from_email(domain_id)
            is_admin_user = gutils.check_if_user_isamdin(credentials,login_email)
            if gutils.check_if_serviceaccount_enabled(login_email) or is_admin_user:
                domain_id = login_email.split('@')[1]

            domain = domain_controller.create_domain(domain_id, domain_name)
            login_user = auth_controller.create_user(login_email, profile_info['given_name'],
                                                     profile_info['family_name'], domain_id, refresh_token,
                                                     is_admin_user,scope_name)

        redirect_url = constants.OAUTH_STATUS_URL + "/success?email={}&authtoken={}".format(login_email,
                                                                                            login_user.auth_token)
    return redirect_url
