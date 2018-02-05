from __future__ import print_function
import json

from adya.datasources.google import auth
from adya.common.constants import READ_DRIVE_SCOPE
from adya.controllers import auth_controller


def google_oauth_request(event, context):
    print("Starting the login")
    print(json.dumps(event))
    scope = event["queryStringParameters"]["scope"]
    if not scope:
        scope = "read_drive"
    auth_url = auth.oauth_request(scope)

    print(auth_url)
    response = {
        "statusCode": 301,
        "headers": {"location": auth_url}
    }

    return response


def google_oauth_callback(event, context):
    print(json.dumps(event))
    print(json.dumps(context))
    params_dict = event["queryStringParameters"]
    auth_code = event["queryStringParameters"]["code"]
    error_msg = ""
    if error in params_dict:
        error_msg = params_dict["error"]
    scope = params_dict["scope"]
    auth_url = auth.oauth_callback(auth_code, scope, error_msg)
    if not auth_url:
        response = {
            "statusCode": 301,
            "headers": {"location": auth_url}
        }
    else:
        response = {
            "statusCode": 401,
            "body": {"message": "Not authenticated"}
        }

    return response


def current_user(event, context):
    auth_token = event["headers"]["Authorization"]
    if not auth_token:
        return {
            "statusCode": 401,
            "body": {"message": "Not authenticated"}
        }
    user_session = auth_controller.get_user_session(auth_token)
    return {
        "statusCode": 200,
        "body": json.dumps(user_session)
    }

