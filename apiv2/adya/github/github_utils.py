
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
    datasource.display_name = constants.ConnectorTypes.GITHUB.value
    datasource.creation_time = datetime.datetime.utcnow()
    datasource.datasource_type = constants.ConnectorTypes.GITHUB.value

    db_session.add(datasource)
    db_connection().commit()

    datasource_credentials = DatasourceCredentials()
    datasource_credentials.datasource_id = datasource.datasource_id
    datasource_credentials.created_user = user_email
    datasource_credentials.credentials = json.dumps({ 'domain_id': user_email.split('@')[1], 'authorize_scope_name': scope, 'token': access_token })
    
    db_session.add(datasource_credentials)
    db_connection().commit()

    # query_params = {
    #     "domain_id": user_email.split('@')[1],
    #     "datasource_id": datasource.datasource_id
    # }

    # messaging.trigger_post_event(urls.GITHUB_SCAN_START, auth_token, query_params, {}, "github")
    #scanner_types = [github_constants.ScannerTypes.USERS.value, github_constants.ScannerTypes.REPOSITORIES.value]
    scanner_type = github_constants.ScannerTypes.ACCOUNT.value
    
    #for scanner_type in scanner_types:
    scanner = DatasourceScanners()
    scanner.datasource_id = datasource.datasource_id
    scanner.scanner_type = scanner_type
    scanner.channel_id = str(uuid.uuid4())
    scanner.user_email = user_email
    scanner.started_at = datetime.datetime.now()
    scanner.in_progress = 1
    db_session.add(scanner)
    db_connection().commit()
    query_params = {"datasource_id": datasource.datasource_id, "domain_id": user_email.split('@')[1], "scanner_id": scanner.id, "change_type": github_constants.AppChangedTypes.ADDED.value}
    messaging.trigger_get_event(urls.GITHUB_SCAN_ENTITIES, auth_token, query_params, "github")
