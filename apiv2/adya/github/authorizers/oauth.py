
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

    user_profile = user.raw_data
    user_email = user_profile['email'] if user_profile['email'] else "{0}+{1}@users.noreply.github.com".format(user_profile['id'], user_profile['login'])
    user_name = user_profile['name']
    user_login = user_profile['login']
    
    # db_session = db_connection().get_session()
    # login_user = db_session.query(LoginUser).filter(LoginUser.auth_token == auth_token).first()
    # datasource = DataSource()
    # datasource.datasource_id = str(uuid.uuid4())
    # datasource.domain_id = login_user.domain_id
    # datasource.display_name = constants.ConnectorTypes.GITHUB.value
    # datasource.creation_time = datetime.datetime.utcnow()
    # datasource.datasource_type = constants.ConnectorTypes.GITHUB.value

    # db_session.add(datasource)
    # db_connection().commit()

    # datasource_credentials = DatasourceCredentials()
    # datasource_credentials.datasource_id = datasource.datasource_id
    # datasource_credentials.created_user = user_email
    # datasource_credentials.credentials = json.dumps({ 'domain_id': user_email.split('@')[1], 'authorize_scope_name': scope, 'token': access_token })
    
    # db_session.add(datasource_credentials)
    # db_connection().commit()

    # query_params = {
    #     "domain_id": user_email.split('@')[1],
    #     "datasource_id": datasource.datasource_id
    # }

    # messaging.trigger_post_event(urls.GITHUB_SCAN_START, auth_token, query_params, {}, "github")
    github_utils.create_datasource(auth_token, access_token, scope, user_email)
    redirect_url = urls.OAUTH_STATUS_URL + "/success?email={0}&authtoken={1}".format(user_email, auth_token)
    return redirect_url