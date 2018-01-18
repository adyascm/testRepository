import json


from datasources.google import authProvider


def oauthloginrequest(event, context):
    auth_url = authProvider.login_request()
    response = {
        "statusCode": 301,
        "headers": { "location": "auth_url" }
    }

    return response

def oauthlogincallback(event, context):
    email = event.get('email')
    name = event.get('name')
    pwd = event.get('pwd')
    user = authProvider.login(email, name, pwd)
    response = {
        "statusCode": 200,
        "body": json.dumps(user)
    }

    return response
