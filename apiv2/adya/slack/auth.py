from slackclient import SlackClient
import slackclient

from adya.common.db import db_utils
from adya.slack import client_credentials

from adya.common.constants import scopeconstants

from adya.common.constants import urls


def request_oauth():
    client_id = client_credentials.client_id
    # try with this client id -  "25151185463.342451215601" (I created slack app for trial)
    scopes = scopeconstants.SLACK_READ_SCOPE
    return urls.SLACK_ENDPOINT + "?scope={0}&client_id={1}".format(scopes, client_id)


def oauth_callback(auth_code):
    auth_code = auth_code

    # An empty string is a valid token for this request
    sc = SlackClient("")

    # Request the auth tokens from Slack
    auth_response = sc.api_call(
        "oauth.access",
        client_id=client_credentials.client_id,
        client_secret=client_credentials.client_secret,
        code=auth_code
    )
    print auth_response

    access_token = auth_response['access_token']

    # getting the user profile information
    sc = SlackClient(access_token)
    profile_info = sc.api_call("users.profile.get")

    if 'error' in profile_info:
        redirect_url = urls.OAUTH_STATUS_URL + "/error?error={}".format("Credentials not found.")
        return redirect_url

    domain_id = profile_info['profile']['email']  # adding login email ad domain id TODO:change needed

    # inserting table into login_user table TODO: beforehand domain info should be there in domain table (foreign key constraint)
    db_utils.create_user(profile_info['profile']['email'], profile_info['profile']['first_name'],
                         profile_info['profile']['last_name'],
                         domain_id, None, None, profile_info['headers']['X-OAuth-Scopes'], access_token)

    redirect_url = urls.OAUTH_STATUS_URL + "/success"  # this is temporary just to check wether redirect is working or not TODO : give proper rediect url
    return redirect_url
