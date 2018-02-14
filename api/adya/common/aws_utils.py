import boto3

from adya.common import constants
from adya.common.constants import LAMBDA_FUNCTION_NAME_FOR_CRON


# create cloudwatch event


def create_cloudwatch_event(cloudwatch_event_name, cron_expression):
    try:
        session = boto3.Session()
        cloudwatch_client = session.client('events')
        lambda_client = session.client('lambda')
        function_name = LAMBDA_FUNCTION_NAME_FOR_CRON
        lambda_function = lambda_client.get_function(
            FunctionName=function_name
        )

        if lambda_function['ResponseMetadata']['HTTPStatusCode'] != constants.SUCCESS_STATUS_CODE:
            print "Did not find the report trigger lambda to be attached to cloud watch event, skipping creating " \
                  "the cloud watch event "
            return False

        # Put an event rule
        response = cloudwatch_client.put_rule(
            Name=cloudwatch_event_name,
            ScheduleExpression=cron_expression,
            State='ENABLED'
        )
        print "Created cloud watch event with response - " + response

        if response['HTTPStatusCode'] == constants.SUCCESS_STATUS_CODE:

            arn = lambda_function['Configuration']['FunctionArn']
            # Adds the specified targets to the specified rule
            response = cloudwatch_client.put_targets(
                Rule=cloudwatch_event_name,
                Targets=[
                    {
                        'Arn': arn,
                        'Id': function_name,
                    }
                ]
            )
            print "Attached the cloud watch event target to the lambda - " + response
            return True
        else:
            print "Unable to create cloudwatch event"
            return False

    except Exception as ex:
        print "Exception occurred while creating the cloudwatch event - " + str(ex)
        return False

