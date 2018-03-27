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
from adya.datasources.google.gutils import get_oauth_service
from adya.db.models import Domain, LoginUser, DomainUser
from adya.db.connection import db_connection
from adya.controllers import auth_controller, domain_controller
from sqlalchemy import and_

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


    service = get_oauth_service(credentials)
    profile_info = service.userinfo().get().execute()

    login_email = profile_info['email'].lower()
    domain_id = login_email
    db_session = db_connection().get_session()
    creation_time = datetime.datetime.utcnow().isoformat()
    login_user = auth_controller.get_user(login_email, db_session)
    is_serviceaccount_enabled = gutils.check_if_serviceaccount_enabled(login_email)
    if is_serviceaccount_enabled:
        domain_id = login_email.split('@')[1]


    if login_user:
        if not login_user.is_serviceaccount_enabled == is_serviceaccount_enabled:
            domain = domain_controller.create_domain(db_session, domain_id, domain_id)
            login_user = auth_controller.create_user(login_email, profile_info['given_name'],
                                                     profile_info['family_name'], domain_id, refresh_token,
                                                     is_serviceaccount_enabled,scope_name)
        elif refresh_token:
            login_user.refresh_token = refresh_token
            login_user.authorize_scope_name = scope_name

        #Update the last login time always
        login_user.last_login_time = datetime.datetime.utcnow().isoformat()
        db_connection().commit()
    else:
        existing_domain_user = db_session.query(DomainUser).filter(and_(DomainUser.email == login_email, DomainUser.member_type == constants.UserMemberType.INTERNAL)).first()
        if existing_domain_user and is_serviceaccount_enabled:
            data_source = domain_controller.get_datasource(None, existing_domain_user.datasource_id, db_session)
            login_user = auth_controller.create_user(login_email, existing_domain_user.first_name,
                                                     existing_domain_user.last_name, domain_id,
                                                     refresh_token, data_source.is_serviceaccount_enabled,scope_name)
        else:

            domain = domain_controller.create_domain(db_session, domain_id, domain_id)
            login_user = auth_controller.create_user(login_email, profile_info['given_name'],
                                                     profile_info['family_name'], domain_id, refresh_token,
                                                     is_serviceaccount_enabled,scope_name)

    redirect_url = constants.OAUTH_STATUS_URL + "/success?email={}&authtoken={}".format(login_email, login_user.auth_token)
    return redirect_url
