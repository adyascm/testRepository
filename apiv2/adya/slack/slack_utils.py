import json
import os
import uuid

import datetime

from enum import Enum
from sqlalchemy import and_

import slack_constants
from adya.common.constants import urls, constants
from adya.common.db.connection import db_connection

from adya.common.db.models import LoginUser, DataSource, DatasourceCredentials, DatasourceScanners, TrustedEntities, \
    DomainUser
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
    datasource_credentials.credentials = json.dumps(
        {'team_id': team_id, 'domain_id': email_domain_id, 'domain_name': domain, 'authorize_scope_name': scopes,
         'token': access_token})
    datasource_credentials.created_user = login_user.email
    db_session.add(datasource_credentials)
    db_connection().commit()

    query_params = {"domainId": email_domain_id,
                            "dataSourceId": datasource.datasource_id,
                            "userEmail": login_user.email}
    messaging.trigger_get_event(urls.SCAN_SLACK_UPDATE, auth_token, query_params, "slack")
            
    return datasource


def get_app_score(scopes):
    max_score = 0
    scopes = scopes.split(",")
    for scope in scopes:
        if scope in SLACK_API_SCOPES:
            score = SLACK_API_SCOPES[scope]['score']
            if score > max_score:
                max_score = score

    return max_score


def get_last_login_time(datasource_id, page_num=1):
    db_session = db_connection().get_session()
    slack_client = get_slack_client(datasource_id)
    login_user_list = slack_client.api_call(
        "team.accessLogs",
        count=500,
        page=page_num
    )

    is_login_user_list = True if login_user_list['ok'] == True else False
    if is_login_user_list:
        current_page = login_user_list['page']
        total_pages = login_user_list['paging']['pages']
        logins = login_user_list['logins']
        for user in logins:
            last_login = datetime.datetime.fromtimestamp(user['date_last'])
            user_id = user['user_id']
            db_session.query(DomainUser).filter(and_(DomainUser.datasource_id ==datasource_id, DomainUser.user_id == user_id)).\
                update({DomainUser.last_login_time: last_login})

        db_connection().commit()

        if current_page != total_pages:
            get_last_login_time(datasource_id, page_num=current_page+1)

