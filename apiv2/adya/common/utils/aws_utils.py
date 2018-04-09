import uuid
from email.mime.application import MIMEApplication
from email.mime.multipart import MIMEMultipart

import boto3
import json

from slugify import slugify

from adya.common.constants import constants

# create cloudwatch event


def create_cloudwatch_event(cloudwatch_event_name, cron_expression, function_name, payload=None):
    try:
        session = boto3.Session()
        cloudwatch_client = session.client('events')
        lambda_client = session.client('lambda')
        lambda_function = lambda_client.get_function(
            FunctionName=function_name
        )

        if lambda_function and lambda_function['ResponseMetadata']['HTTPStatusCode'] != constants.SUCCESS_STATUS_CODE:
            print "Did not find the report trigger lambda to be attached to cloud watch event, skipping creating " \
                  "the cloud watch event "
            return False

        # Put an event rule
        response = cloudwatch_client.put_rule(
            Name=cloudwatch_event_name,
            ScheduleExpression=cron_expression,
            State='ENABLED'
        )
        print "Created cloud watch event with response - " + str(response)

        if response and response['ResponseMetadata']['HTTPStatusCode'] == constants.SUCCESS_STATUS_CODE:

            arn = lambda_function['Configuration']['FunctionArn']
            # Adds the specified targets to the specified rule
            targetresponse = cloudwatch_client.put_targets(
                Rule=cloudwatch_event_name,
                Targets=[
                    {
                        'Arn': arn,
                        'Id': function_name,
                        'Input': json.dumps(payload)
                    }
                ]
            )
            print "Attached the cloud watch event target to the lambda - " + \
                str(targetresponse)

            response = lambda_client.add_permission(
                Action='lambda:InvokeFunction',
                FunctionName=function_name,
                Principal='events.amazonaws.com',
                SourceArn=response['RuleArn'],
                StatementId=str(uuid.uuid4()),
            )

            print "adding permission for lambda - " + str(response)

            return True
        else:
            print "Unable to create cloudwatch event"
            return False

    except Exception as ex:
        print "Exception occurred while creating the cloudwatch event - " + \
            str(ex)
        return False


def delete_cloudwatch_event(cloudwatch_event_name, function_name):
    try:
        session = boto3.Session()
        cloudwatch_client = session.client('events')
        print "delete_cloudwatch_event : "
        # remove all the targets from the rule
        response = cloudwatch_client.remove_targets(
            Rule=cloudwatch_event_name,
            Ids=[
                function_name,
            ]
        )

        print "removed target : "

        if response and response['ResponseMetadata']['HTTPStatusCode'] == constants.SUCCESS_STATUS_CODE:
            # after removing all the targets , now delete the rule

            response = cloudwatch_client.delete_rule(
                Name=cloudwatch_event_name
            )

            print "removed rule  : "
    except Exception as ex:
        print "Exception occurred while deleting the cloudwatch event - " + \
            str(ex)
        return False


def send_email(user_list, email_subject, rendered_html):
    try:
        session = boto3.Session()
        ses_client = session.client('ses')
        ses_client.send_email(
            Source='service@adya.io',
            Destination={'ToAddresses': user_list, 'BccAddresses': [
                'service@adya.io',
            ]},
            Message={
                'Subject': {
                    'Data': email_subject
                },
                'Body': {
                    'Text': {
                        'Data': email_subject
                    },
                    'Html': {
                        'Data': rendered_html
                    }
                }
            }
        )

    except Exception as e:
        print e
        print "Exception occurred sending ", email_subject, " email to: ", user_list


def send_email_with_attachment(user_list, csv_data, report_desc, report_name):

    print "sending raw email start : "
    try:
        filename = str(report_name) + ".csv"
        msg = MIMEMultipart('mixed')
        msg['Subject'] = report_desc
        msg['From'] = "service@adya.io"
        att = MIMEApplication(csv_data)
        att.add_header('Content-Disposition', 'attachment', filename=filename)
        msg.attach(att)

        session = boto3.Session()
        ses_client = session.client('ses')
        ses_client.send_raw_email(
            Source='service@adya.io',
            Destinations=user_list,
            RawMessage={
                'Data': msg.as_string()
            },
        )

        print "email sent "
    except Exception as e:
        print e
        print "Exception occurred sending  email to: ", user_list


def invoke_lambda(function_name, auth_token, body):
    try:
        if not body:
            body = {}
        body['Authorization'] = auth_token
        client = boto3.client('lambda')
        response = client.invoke(
            FunctionName=function_name,
            InvocationType='Event',
            LogType='None',
            Payload=bytes(json.dumps(body))
        )
    except Exception as ex:
        print "Exception occurred while invoking lambda function {}".format(
            function_name)
        print ex


def get_lambda_name(httpmethod, endpoint, service_name="core"):
    lambda_name = service_name + "-" + \
        constants.DEPLOYMENT_ENV + '-' + \
        str(httpmethod) + '-' + slugify(endpoint)
    return lambda_name
