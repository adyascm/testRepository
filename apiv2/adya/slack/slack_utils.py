from adya.common.db.connection import db_connection

from adya.common.db.models import LoginUser
from slackclient import SlackClient


def get_slack_client(authtoken):

    db_session = db_connection().get_session()
    login_user_info = db_session.query(LoginUser).filter(LoginUser.auth_token == authtoken).first()

    access_token = login_user_info.token

    sc = SlackClient(access_token)

    return sc