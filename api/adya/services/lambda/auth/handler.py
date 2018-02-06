from __future__ import print_function
import json

from adya.datasources.google import auth
from adya.common.scopeconstants import READ_DRIVE_SCOPE
from adya.controllers import auth_controller


def google_oauth_request(event, context):
    print("Starting the login")
    scope = event["scopes"]
    if not scope:
        scope = "read_drive"
    auth_url = auth.oauth_request(scope)

    response = {
        "statusCode": 301,
        "headers": {"location": auth_url}
    }

    return response


def google_oauth_callback(event, context):
    auth_code = event["code"]
    error = event["error"]
    scope = event["scopes"]
    if not scope:
        scope = "read_drive"
    auth_url = auth.oauth_callback(auth_code, scope, error)
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
    auth_token = event["Authorization"]
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

