import json


from datasources.google import authProvider


def login(event, context):
    email = event.get('email')
    name = event.get('name')
    pwd = event.get('pwd')
    user = authProvider.login(email, name, pwd)
    response = {
        "statusCode": 200,
        "body": json.dumps(user)
    }

    return response
