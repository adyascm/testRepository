
import os
import json
import uuid
from adya.common.db.models import DataSource, DatasourceCredentials, LoginUser, DatasourceScanners
from adya.common.constants import constants
from adya.common.db.connection import db_connection
from adya.common.utils import messaging
from adya.common.constants import urls
from github import Github
import datetime
import github_constants

dir_path = os.path.dirname(os.path.realpath(__file__))
CLIENT_CREDENTIALS_FILE = dir_path + "/client_credentials.json"
GITHUB_CLIENT_JSON_FILE_DATA = json.load(open(CLIENT_CREDENTIALS_FILE))
GITHUB_CLIENT_ID = GITHUB_CLIENT_JSON_FILE_DATA['client_id']
GITHUB_CLIENT_SECRET = GITHUB_CLIENT_JSON_FILE_DATA['client_secret']

def is_external_user(domain_id, email):
    if email.endswith(domain_id):
        return False
    else:
        return True

def get_default_github_email(user_id, login_name):
    return "{0}+{1}@users.noreply.github.com".format(user_id, login_name)

def get_github_client(datasource_id):
    db_session = db_connection().get_session()
    credentials = db_session.query(DatasourceCredentials.credentials).filter(DatasourceCredentials.datasource_id == datasource_id).first()
    credentials = json.loads(credentials.credentials)
    access_token = credentials["token"]
    git = Github(access_token)
    return git

def create_datasource(auth_token, access_token, scope, user_email):
    db_session = db_connection().get_session()
    login_user = db_session.query(LoginUser).filter(LoginUser.auth_token == auth_token).first()
    datasource = DataSource()
    datasource.datasource_id = str(uuid.uuid4())
    datasource.domain_id = login_user.domain_id
    datasource.display_name = login_user.domain_id
    datasource.creation_time = datetime.datetime.utcnow()
    datasource.datasource_type = constants.ConnectorTypes.GITHUB.value
    datasource.is_push_notifications_enabled = 0

    db_session.add(datasource)
    db_connection().commit()

    github_domain_id = user_email.split('@')[1] if user_email else login_user.domain_id
    datasource_credentials = DatasourceCredentials()
    datasource_credentials.datasource_id = datasource.datasource_id
    datasource_credentials.created_user = user_email
    datasource_credentials.credentials = json.dumps({ 'domain_id': github_domain_id, 'authorize_scope_name': scope, 'token': access_token })
    
    db_session.add(datasource_credentials)
    db_connection().commit()

    query_params = {"domainId": github_domain_id,
                            "dataSourceId": datasource.datasource_id,
                            "userEmail": login_user.email}
    messaging.trigger_get_event(urls.GITHUB_SCAN_UPDATE, auth_token, query_params, "github")
    