
from adya.common.constants import urls
from adya.github import github_utils
from adya.common.constants import scopeconstants, constants
from github import Github
from adya.common.db.connection import db_connection
# from adya.common.db.models import LoginUser, DataSource, DatasourceCredentials
# from adya.common.utils import messaging
import requests
import json
import uuid
import datetime

def oauth_request(auth_token):
    client_id = github_utils.GITHUB_CLIENT_ID
    scopes = scopeconstants.GITHUB_SCOPE
    redirect_uri = urls.GITHUB_OAUTH_CALLBACK_URL

    return urls.GITHUB_ENDPOINT + "?client_id={0}&state={1}&redirect_uri={2}&scope={3}".\
        format(client_id, auth_token, redirect_uri, scopes)

def oauth_callback(auth_code, auth_token):
    params = {
        'client_id': github_utils.GITHUB_CLIENT_ID,
        'client_secret': github_utils.GITHUB_CLIENT_SECRET,
        'code': auth_code,
        'redirect_uri': urls.GITHUB_OAUTH_CALLBACK_URL,
        'state': auth_token
    }
    headers = {
        'accept': 'application/json'
    }
    response = requests.post(urls.GITHUB_TOKEN_ENDPOINT, params=params, headers=headers)
    response_content = json.loads(response.content)
    access_token = response_content['access_token']
    scope = response_content['scope']

    git = Github(access_token)
    user = git.get_user()
    
    if not user:
        redirect_url = urls.OAUTH_STATUS_URL + "/error?error={0}".format("User credentials not found")
        return redirect_url
    
    user_email = user.email
    github_utils.create_datasource(auth_token, access_token, scope, user_email)
    redirect_url = urls.OAUTH_STATUS_URL + "/success?email={0}&authtoken={1}".format(user_email, auth_token)
    return redirect_url