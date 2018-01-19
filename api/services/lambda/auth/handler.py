import json


from datasources.google import authProvider


def googleoauthlogin(event, context):
    auth_url = authProvider.login_request()
    response = {
        "statusCode": 301,
        "headers": { "location": "auth_url" }
    }

    return response

def googleoauthcallback(event, context):
    auth_code = event["code"]
    error = event["error"]
    auth_url = authProvider.login_callback(auth_code, error)
    if not auth_url:
        response = {
            "statusCode": 301,
            "headers": { "location": "auth_url" }
        }
    else:
        response = {
            "statusCode": 401,
            "body": { "message": "Not authenticated" }
        }

    return response
