import json
import uuid

import datetime
from slackclient import SlackClient
import slackclient

from adya.common.db import db_utils
from adya.common.db.connection import db_connection
from adya.common.db.models import DataSource, DatasourceCredentials, LoginUser
from adya.common.utils import messaging

from adya.common.constants import scopeconstants, constants

from adya.common.constants import urls
from adya.slack import slack_utils


def request_oauth(scope, auth_token):
    client_id = slack_utils.SLACK_CLIENT_ID
    # try with this client id -  "25151185463.342451215601" (I created slack app for trial)
    scopes = scopeconstants.SLACK_READ_SCOPE
    redirect_uri = urls.SLACK_OAUTH_CALLBACK_URL
    if scope:
        scopes = scopeconstants.SLACK_SCOPE_DICT[scope]
    return urls.SLACK_ENDPOINT + "?scope={0}&client_id={1}&state={2}&redirect_uri={3}".\
                        format(scopes, client_id, auth_token, redirect_uri)


def oauth_callback(auth_code, auth_token):
    auth_code = auth_code

    # An empty string is a valid token for this request
    sc = SlackClient("")

    # Request the auth tokens from Slack
    auth_response = sc.api_call(
        "oauth.access",
        client_id=slack_utils.SLACK_CLIENT_ID,
        client_secret=slack_utils.SLACK_CLIENT_SECRET,
        code=auth_code,
        redirect_uri=urls.SLACK_OAUTH_CALLBACK_URL
    )
    print auth_response

    access_token = auth_response['access_token']
    scopes = auth_response['scope']

    # getting the user profile information
    sc = SlackClient(access_token)
    profile_info = sc.api_call("users.profile.get")

    if 'error' in profile_info:
        redirect_url = urls.OAUTH_STATUS_URL + "/error?error={}".format("Credentials not found.")
        return redirect_url

    user_email = profile_info['profile']['email']
    connected_user_domain_id = user_email.split('@')[1]

    db_session = db_connection().get_session()
    login_user = db_session.query(LoginUser).filter(LoginUser.auth_token == auth_token).first()
    datasource_id = str(uuid.uuid4())
    datasource = DataSource()
    datasource.domain_id = login_user.domain_id
    datasource.datasource_id = datasource_id
    datasource.display_name = connected_user_domain_id

    datasource.creation_time = datetime.datetime.utcnow()
    datasource.datasource_type = constants.ConnectorTypes.SLACK


    db_session.add(datasource)
    db_connection().commit()

    query_params = {"domainId": connected_user_domain_id,
                    "dataSourceId": datasource.datasource_id,
                    }

    datasource_credentials = DatasourceCredentials()
    datasource_credentials.datasource_id = datasource.datasource_id
    datasource_credentials.credentials = json.dumps({'domain_id': connected_user_domain_id, 'authorize_scope_name': scopes, 'token': access_token})
    datasource_credentials.created_user = user_email
    db_session.add(datasource_credentials)
    db_connection().commit()

    messaging.trigger_post_event(urls.SCAN_SLACK_START, login_user.auth_token, query_params, {}, "slack")


    redirect_url = urls.OAUTH_STATUS_URL + "/success?email={}&authtoken={}".format(login_user.domain_id, login_user.auth_token)  # this is temporary just to check wether redirect is working or not TODO : give proper rediect url
    return redirect_url
