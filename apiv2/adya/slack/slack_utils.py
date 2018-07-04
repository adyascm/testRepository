import json
import os
import uuid

import datetime

from enum import Enum
import slack_constants
from adya.common.constants import urls, constants
from adya.common.db.connection import db_connection

from adya.common.db.models import LoginUser, DataSource, DatasourceCredentials, DatasourceScanners
from slackclient import SlackClient

from adya.common.utils import messaging

dir_path = os.path.dirname(os.path.realpath(__file__))
SLACK_API_SCOPES = json.load(open(dir_path + "/slack_api_scopes.json"))
CLIENT_CREDENTIALS_FILE = dir_path + "/client_credentials.json"
SLACK_CLIENT_JSON_FILE_DATA = json.load(open(CLIENT_CREDENTIALS_FILE))
SLACK_CLIENT_ID = SLACK_CLIENT_JSON_FILE_DATA['client_id']
SLACK_CLIENT_SECRET = SLACK_CLIENT_JSON_FILE_DATA['client_secret']


def get_slack_client(datasource_id):
    db_session = db_connection().get_session()
    datasource_credentials = db_session.query(DatasourceCredentials).filter(
        DatasourceCredentials.datasource_id == datasource_id) \
        .first()

    credentials = json.loads(datasource_credentials.credentials)

    access_token = credentials['token']

    sc = SlackClient(access_token)

    return sc


def check_for_admin_user(authtoken, user_id):
    slack_client = get_slack_client(authtoken)
    user_info = slack_client.api_call(
        "users.info",
        user=user_id
    )

    is_admin = user_info['is_admin']
    return is_admin


def create_datasource(auth_token, access_token, scopes, team_id, domain, email_domain_id):
    now = datetime.datetime.utcnow()
    db_session = db_connection().get_session()
    login_user = db_session.query(LoginUser).filter(LoginUser.auth_token == auth_token).first()
    datasource_id = str(uuid.uuid4())
    datasource = DataSource()
    datasource.domain_id = login_user.domain_id
    datasource.datasource_id = datasource_id
    datasource.display_name = domain
    datasource.creation_time = now
    datasource.is_push_notifications_enabled = 0
    datasource.datasource_type = constants.ConnectorTypes.SLACK.value
    datasource.source_id = team_id
    db_session.add(datasource)
    db_connection().commit()

    datasource_credentials = DatasourceCredentials()
    datasource_credentials.datasource_id = datasource.datasource_id
    datasource_credentials.credentials = json.dumps({'team_id': team_id, 'domain_id': email_domain_id, 'domain_name': domain, 'authorize_scope_name': scopes, 'token': access_token})
    datasource_credentials.created_user = login_user.email
    db_session.add(datasource_credentials)
    db_connection().commit()

    query_params = {"domainId": datasource.domain_id,
                            "dataSourceId": datasource.datasource_id,
                            "userEmail": login_user.email}
    messaging.trigger_get_event(urls.SCAN_SLACK_UPDATE, auth_token, query_params, "slack")
            
    return datasource

def get_resource_exposure_type(permission_exposure, resource_exposure):
    if permission_exposure == constants.EntityExposureType.ANYONEWITHLINK.value:
        return permission_exposure
    if permission_exposure == constants.EntityExposureType.EXTERNAL.value and not(resource_exposure == constants.EntityExposureType.ANYONEWITHLINK.value):
        resource_exposure = constants.EntityExposureType.EXTERNAL.value
    if permission_exposure == constants.EntityExposureType.DOMAIN.value and not (resource_exposure == constants.EntityExposureType.EXTERNAL.value or
                                                                                     resource_exposure == constants.EntityExposureType.ANYONEWITHLINK.value):
        resource_exposure = constants.EntityExposureType.DOMAIN.value
    elif permission_exposure == constants.EntityExposureType.INTERNAL.value and not (resource_exposure == constants.EntityExposureType.EXTERNAL.value or
            resource_exposure == constants.EntityExposureType.ANYONEWITHLINK.value or resource_exposure == constants.EntityExposureType.DOMAIN.value):
        resource_exposure = constants.EntityExposureType.INTERNAL.value
    return resource_exposure


def get_app_score(scopes):
    max_score = 0
    scopes = scopes.split(",")
    for scope in scopes:
        if scope in SLACK_API_SCOPES:
            score = SLACK_API_SCOPES[scope]['score']
            if score > max_score:
                max_score = score

    return max_score


def is_external_user(domain_id, email):
    if email.endswith(domain_id):
            return False
    else:
        return True
