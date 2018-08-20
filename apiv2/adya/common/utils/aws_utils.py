import uuid
from email.mime.application import MIMEApplication
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from adya.common.utils.response_messages import Logger, ResponseMessage
from boto3.s3.transfer import S3Transfer

import boto3
import json

from slugify import slugify

from adya.common.constants import constants
from datetime import datetime

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
            Logger().info("Did not find the report trigger lambda to be attached to cloud watch event, skipping creating " \
                  "the cloud watch event ")
            return False

        # Put an event rule
        response = cloudwatch_client.put_rule(
            Name=cloudwatch_event_name,
            ScheduleExpression=cron_expression,
            State='ENABLED'
        )
        Logger().info("Created cloud watch event with response - " + str(response))

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
            Logger().info("Attached the cloud watch event target to the lambda - " + \
                    str(targetresponse))

            policy = lambda_client.get_policy(FunctionName=function_name)['Policy']
            if policy:
                policy = json.loads(policy)
                policy_exists = False
                Logger().info("policy - {} for lambda function - {}".format(policy, function_name))
                for stmt in policy['Statement']:
                    if stmt['Action'] == 'lambda:InvokeFunction':
                        policy_exists = True

                Logger().info("check policy exist - {} for lambda - {}".format(policy_exists, function_name))
                if not policy_exists:
                    response = lambda_client.add_permission(
                        Action='lambda:InvokeFunction',
                        FunctionName=function_name,
                        Principal='events.amazonaws.com',
                        SourceArn=response['RuleArn'],
                        StatementId=str(uuid.uuid4()),
                    )
                    Logger().info("Added permission for lambda - " + str(response))


            return True
        else:
            Logger().info("Unable to create cloudwatch event")
            return False

    except Exception as ex:
        Logger().exception("Exception occurred while creating the cloudwatch event - ")
        return False


def delete_cloudwatch_event(cloudwatch_event_name, function_name):
    try:
        session = boto3.Session()
        cloudwatch_client = session.client('events')
        Logger().info("delete_cloudwatch_event : ")
        # remove all the targets from the rule
        response = cloudwatch_client.remove_targets(
            Rule=cloudwatch_event_name,
            Ids=[
                function_name,
            ]
        )

        Logger().info("removed target : ")

        if response and response['ResponseMetadata']['HTTPStatusCode'] == constants.SUCCESS_STATUS_CODE:
            # after removing all the targets , now delete the rule

            response = cloudwatch_client.delete_rule(
                Name=cloudwatch_event_name
            )

            Logger().info("removed rule  : ")
    except Exception as ex:
        Logger().exception("Exception occurred while deleting the cloudwatch event - ")
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
        Logger().exception("Exception occurred sending "+ str(email_subject) + " email to: "+ str(user_list))


def send_email_with_attachment(user_list, csv_data, report_desc, report_name):
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

        Logger().info("Email sent to - {}".format(str(user_list)))
    except Exception as e:
        Logger().exception("Exception occurred sending  email to: " + str(user_list))


def invoke_lambda(function_name, auth_token, body, trigger_type=constants.TriggerType.ASYNC.value):
    if not body:
        body = {}
    body['Authorization'] = auth_token
    client = boto3.client('lambda')
    response = client.invoke(
        FunctionName=function_name,
        InvocationType='Event' if trigger_type == constants.TriggerType.ASYNC.value else 'RequestResponse',
        LogType='None',
        Payload=bytes(json.dumps(body))
    )
    response_payload = {"statusCode": 200, "body": ""}
    if trigger_type == constants.TriggerType.SYNC.value:
        response_payload = json.loads(response['Payload'].read().decode("utf-8"))
        Logger().info("Response from sync lambda invocation is - {}".format(response_payload))
        if "errorMessage" in response_payload:
            return ResponseMessage(500, response_payload['errorMessage'])

    return ResponseMessage(response_payload['statusCode'], None, response_payload['body'])


def get_lambda_name(httpmethod, endpoint, service_name="core"):
    lambda_name = service_name + "-" + \
        constants.DEPLOYMENT_ENV + '-' + \
        str(httpmethod) + '-' + slugify(endpoint)
    return lambda_name


def upload_file_in_s3_bucket(bucket_name, key, temp_csv):    
    try:
        client = boto3.client('s3')
        transfer = S3Transfer(client)
        transfer.upload_file(temp_csv.name, bucket_name, key)
    
    except Exception as ex:
        print ex
        return None
    
    #Constructing a temporary file url 
    temp_url = client.generate_presigned_url(
        'get_object', 
        Params = {
            'Bucket': bucket_name,
            'Key': key,
        },
        ExpiresIn=3600)
        
    return temp_url


def send_email_with_html_and_attachement(user_list, csv_data, report_desc, report_name, rendered_html):
    try:
        filename = str(report_name) + ".csv"
        msg = MIMEMultipart('mixed')
        msg['Subject'] = report_desc
        msg['From'] = "service@adya.io"
        att = MIMEApplication(csv_data)
        att.add_header('Content-Disposition', 'attachment', filename=filename)
        msg.attach(att)
        msg.attach(MIMEText(rendered_html, 'html'))

        session = boto3.Session()
        ses_client = session.client('ses')
        ses_client.send_raw_email(
            Source='service@adya.io',
            Destinations=user_list,
            RawMessage={
                'Data':''
            },
        )

        Logger().info("Email sent to - {}".format(str(user_list)))
    except Exception as e:
        Logger().exception("Exception occurred sending  email to: " + str(user_list))
