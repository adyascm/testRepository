from __future__ import print_function
import json

from adya.controllers.domain_controller import domain_controller


def get_datasource(event, context):
    auth_token = event["headers"]["Authorization"]
    if not auth_token:
        return {
            "statusCode": 401,
            {message: "Not authenticated"}}
    datasource = domain_controller.get_datasource(auth_token)
    if datasource:
        response = {
            "statusCode": 200,
            json.dumps(datasource)
        }

    return response



def post_datasource(event, context):
    auth_token = event["headers"]["Authorization"]
    if not auth_token:
        return {
            "statusCode": 401,
            {message: "Not authenticated"}}
    datasource = domain_controller.create_datasource(auth_token, event['data'])
    if datasource:
        response = {
            "statusCode": 201,
            json.dumps(datasource)
        }

    return response

