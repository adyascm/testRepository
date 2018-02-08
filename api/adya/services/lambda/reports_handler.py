import json

from adya.controllers import reports_controller
from cloudwatch_event import create_cloudwatch_event


def post_scheduled_report(event, context):
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

    report = reports_controller.create_report(auth_token, event['data'])
    cron_expression = event['data']['frequency']
    report_id = event['data']['report_id']
    report_name = event['data']['report_name']
    cloudwatch_event_name = report_id + '-' + report_name

    create_cloudwatch_event(cloudwatch_event_name, cron_expression)

    if report:
        response = {
            "statusCode": 201,
            "body": json.dumps(report),
            "headers": {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Credentials": True
            },
        }

    return response
