import requests

import google.oauth2.credentials
import google_auth_oauthlib.flow
import googleapiclient.discovery

CLIENT_SECRETS_FILE = "client_secrets.json"

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
    flow.redirect_uri = "http://localhost:5000/oauthlogincallback"
    authorization_url, state = flow.authorization_url(
      # Enable offline access so that you can refresh an access token without
      # re-prompting the user for permission. Recommended for web server apps.
      access_type='offline',
      # Enable incremental authorization. Recommended as a best practice.
      include_granted_scopes='true')

    return authorization_url