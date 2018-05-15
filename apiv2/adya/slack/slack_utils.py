import uuid

import datetime

from adya.common.constants import urls
from adya.common.db.connection import db_connection

from adya.common.db.models import LoginUser, DataSource
from slackclient import SlackClient

from adya.common.utils import messaging


def get_slack_client(authtoken):
    db_session = db_connection().get_session()
    login_user_info = db_session.query(LoginUser).filter(LoginUser.auth_token == authtoken).first()

    access_token = login_user_info.token

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