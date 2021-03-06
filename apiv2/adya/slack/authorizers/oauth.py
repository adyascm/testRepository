import json
import uuid

import datetime
from slackclient import SlackClient
import slackclient

from adya.common.db import db_utils
from adya.common.db.connection import db_connection
from adya.common.db.models import DataSource, DatasourceCredentials, LoginUser, DatasourceScanners
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

    access_token = auth_response['access_token']
    scopes = auth_response['scope']

    # getting the user profile information
    sc = SlackClient(access_token)
    team_info = sc.api_call("team.info")

    if 'error' in team_info:
        redirect_url = urls.OAUTH_STATUS_URL + "/error?error=Error in getting team info - {}".format(team_info['error'])
        return redirect_url

    team_id = team_info['team']['id']
    domain = team_info['team']['domain']
    email_domain_id = team_info['team']['email_domain']

    slack_utils.create_datasource(auth_token, access_token, scopes, team_id, domain, email_domain_id)

    redirect_url = urls.OAUTH_STATUS_URL + "/success?email={}&authtoken={}".format(email_domain_id, auth_token)  # this is temporary just to check wether redirect is working or not TODO : give proper rediect url
    return redirect_url
