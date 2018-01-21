import requests
import google_auth_oauthlib.flow
import google.oauth2.credentials

import googleapiclient.discovery

from api.adya.common import constants

import os 
dir_path = os.path.dirname(os.path.realpath(__file__))
CLIENT_SECRETS_FILE = dir_path+"/client_secrets.json"

API_SERVICE_NAME = "drive"
API_VERSION = 'v2'

SCOPES = ['https://www.googleapis.com/auth/drive ' \
        'https://www.googleapis.com/auth/admin.directory.user ' \
        'https://www.googleapis.com/auth/admin.directory.group ' \
        'https://www.googleapis.com/auth/admin.reports.audit.readonly ' \
        'https://www.googleapis.com/auth/drive ']\

def login_request():
    flow = google_auth_oauthlib.flow.Flow.from_client_secrets_file(
      CLIENT_SECRETS_FILE, scopes=SCOPES)
    flow.redirect_uri = constants.API_HOST + "/googleoauthcallback"
    authorization_url, state = flow.authorization_url(
      # Enable offline access so that you can refresh an access token without
      # re-prompting the user for permission. Recommended for web server apps.
      access_type='offline',
      # Enable incremental authorization. Recommended as a best practice.
      include_granted_scopes='true')

    return authorization_url

def login_callback(auth_code, error):
    if error or not auth_code:
        return ""
    flow = google_auth_oauthlib.flow.Flow.from_client_secrets_file(
      CLIENT_SECRETS_FILE, scopes=SCOPES)
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


    return authorization_url