from __future__ import print_function
import json

from adya.controllers import domain_controller


def get_datasource(event, context):
    auth_token = event["headers"]["Authorization"]
    if not auth_token:
        return {
            "statusCode": 401,
            "body": {"message": "Not authenticated"},
            "headers": {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Credentials": True
            }
        }
    datasource = domain_controller.get_datasource(auth_token)
    if datasource:
        response = {
            "statusCode": 200,
            "body": json.dumps(datasource),
            "headers": {
                "Access-Control-Allow-Origin": "*", 
                "Access-Control-Allow-Credentials": True
            }
        }

    return response


def post_datasource(event, context):
    auth_token = event["headers"]["Authorization"]
    if not auth_token:
        return {
            "statusCode": 401,
            "body": {"message": "Not authenticated"},
            "headers": {
                "Access-Control-Allow-Origin": "*", 
                "Access-Control-Allow-Credentials": True 
            },
        }
    datasource = domain_controller.create_datasource(auth_token, event['data'])
    if datasource:
        response = {
            "statusCode": 201,
            "body": json.dumps(datasource),
            "headers": {
                "Access-Control-Allow-Origin": "*", 
                "Access-Control-Allow-Credentials": True 
            },
        }

    return response
