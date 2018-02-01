from __future__ import print_function
import json

from adya.datasources.google import authProvider

def google_oauth_request(event, context):
    print("Starting the login")
    auth_url = authProvider.oauth_request()
    print(auth_url)
    response = {
        "statusCode": 301,
        "headers": { "location": auth_url }
    }

    return response

def google_oauth_callback(event, context):
    auth_code = event["code"]
    error = event["error"]
    auth_url = authProvider.oauth_callback(auth_code, error)
    if not auth_url:
        response = {
            "statusCode": 301,
            "headers": { "location": auth_url }
        }
    else:
        response = {
            "statusCode": 401,
            "body": { "message": "Not authenticated" }
        }

    return response

if __name__ == '__main__':
    googleoauthlogin('','')
