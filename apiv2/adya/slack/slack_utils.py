import json
import os
import uuid

import datetime

from enum import Enum

from adya.common.constants import urls, constants
from adya.common.db.connection import db_connection

from adya.common.db.models import LoginUser, DataSource, DatasourceCredentials
from slackclient import SlackClient

from adya.common.utils import messaging

dir_path = os.path.dirname(os.path.realpath(__file__))
SLACK_API_SCOPES = json.load(open(dir_path + "/slack_api_scopes.json"))


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


def create_datasource(auth_token, db_session, existing_user, payload):
    datasource_id = str(uuid.uuid4())
    datasource = DataSource()
    datasource.domain_id = existing_user.domain_id
    datasource.datasource_id = datasource_id

    if payload.get("display_name"):
        datasource.display_name = payload["display_name"]
    else:
        datasource.display_name = "Unnamed datasource"

    datasource.creation_time = datetime.datetime.utcnow()
    datasource.datasource_type = payload["datasource_type"]

    db_session.add(datasource)
    db_connection().commit()

    query_params = {"domainId": datasource.domain_id,
                    "dataSourceId": datasource.datasource_id,
                    }
    messaging.trigger_post_event(urls.SCAN_SLACK_START, auth_token, query_params, {}, "slack")
    return datasource


def get_resource_exposure_type(permission_exposure, resource_exposure):
    if permission_exposure == constants.ResourceExposureType.DOMAIN and not (
        resource_exposure == constants.ResourceExposureType.ANYONEWITHLINK):
        resource_exposure = constants.ResourceExposureType.DOMAIN
    elif permission_exposure == constants.ResourceExposureType.INTERNAL and not (
            resource_exposure == constants.ResourceExposureType.ANYONEWITHLINK or resource_exposure == constants.ResourceExposureType.DOMAIN):
        resource_exposure = constants.ResourceExposureType.INTERNAL
    return resource_exposure


class AppChangedTypes(Enum):
    ADDED = "added"
    REMOVED = "removed"


def get_app_score(scopes):
    max_score = 0
    scopes = scopes.split(",")
    for scope in scopes:
        if scope in SLACK_API_SCOPES:
            score = SLACK_API_SCOPES[scope]['score']
            if score > max_score:
                max_score = score

    return max_score
