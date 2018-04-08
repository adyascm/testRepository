import os
import datetime
import uuid

import google_auth_oauthlib.flow
import google.oauth2.credentials
from google.oauth2 import service_account
import googleapiclient.discovery
from oauth2client.service_account import ServiceAccountCredentials

from adya.common.constants.scopeconstants import LOGIN_SCOPE, DRIVE_SCAN_SCOPE, SCOPE_DICT
import gutils

from adya.common.email_templates import adya_emails
from adya.common.constants import constants, urls
from adya.common.db.models import Domain, LoginUser, DomainUser
from adya.common.db.connection import db_connection
from adya.common.db import db_utils
from sqlalchemy import and_

def oauth_request(scopes):
    scope = LOGIN_SCOPE
    if scopes in SCOPE_DICT:
        scope = SCOPE_DICT[scopes]
    state = scopes
    flow = google_auth_oauthlib.flow.Flow.from_client_secrets_file(
        gutils.CLIENT_SECRETS_FILE, scopes=scope)
    flow.redirect_uri = urls.GOOGLE_OAUTH_CALLBACK_URL
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
        redirect_url = urls.OAUTH_STATUS_URL + "/error?error={}".format(error)
        return redirect_url
    # in state we are passing the login scope name
    scope_name = state
    scope = LOGIN_SCOPE
    if scope_name in SCOPE_DICT:
        scope = SCOPE_DICT[scope_name]
    flow = google_auth_oauthlib.flow.Flow.from_client_secrets_file(
        gutils.CLIENT_SECRETS_FILE, scopes=scope)
    flow.redirect_uri = urls.GOOGLE_OAUTH_CALLBACK_URL
    # Use the authorization server's response to fetch the OAuth 2.0 tokens.
    flow.fetch_token(code=oauth_code)

    credentials = flow.credentials
    
    if not credentials:
        redirect_url = urls.OAUTH_STATUS_URL + "/error?error={}".format("Credentials not found.")
        return redirect_url

    refresh_token = credentials.refresh_token
    token = credentials.token

    service = gutils.get_oauth_service(credentials)
    profile_info = service.userinfo().get().execute()

    login_email = profile_info['email'].lower()
    print "Credentials received for {} are token: {}, refresh_token: {}, scopes: {}".format(login_email, credentials.token, credentials.refresh_token, credentials.scopes)
    domain_id = login_email
    db_session = db_connection().get_session()
    creation_time = datetime.datetime.utcnow()
    login_user = db_utils.get_login_user_from_email(login_email, db_session)
    is_serviceaccount_enabled = gutils.check_if_serviceaccount_enabled(login_email)
    if is_serviceaccount_enabled:
        domain_id = login_email.split('@')[1]


    if login_user:
        if not login_user.is_serviceaccount_enabled == is_serviceaccount_enabled:
            domain = db_utils.create_domain(db_session, domain_id, domain_id)
            login_user = db_utils.create_user(login_email, profile_info['given_name'],
                                                     profile_info['family_name'], domain_id, refresh_token,
                                                     is_serviceaccount_enabled,scope_name, token, db_session=db_session)
            adya_emails.send_welcome_email(login_user)

        elif refresh_token:
            login_user.refresh_token = refresh_token
            login_user.authorize_scope_name = scope_name
            login_user.token = token

        #Update the last login time always
        login_user.last_login_time = datetime.datetime.utcnow()
        db_connection().commit()
    else:
        existing_domain_user = db_session.query(DomainUser).filter(and_(DomainUser.email == login_email, DomainUser.member_type == constants.UserMemberType.INTERNAL)).first()
        if existing_domain_user and is_serviceaccount_enabled:
            data_source = db_utils.get_datasource(existing_domain_user.datasource_id, db_session)
            login_user = db_utils.create_user(login_email, existing_domain_user.first_name,
                                                     existing_domain_user.last_name, domain_id,
                                                     refresh_token, data_source.is_serviceaccount_enabled,scope_name, token, db_session)
        else:

            domain = db_utils.create_domain(db_session, domain_id, domain_id)
            login_user = db_utils.create_user(login_email, profile_info['given_name'],
                                                     profile_info['family_name'], domain_id, refresh_token,
                                                     is_serviceaccount_enabled,scope_name, token, db_session)
        adya_emails.send_welcome_email(login_user)

    redirect_url = urls.OAUTH_STATUS_URL + "/success?email={}&authtoken={}".format(login_email, login_user.auth_token)
    return redirect_url
