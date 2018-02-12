import boto3

from adya.common.constants import LAMBDA_FUNCTION_NAME_FOR_CRON

session = boto3.Session(profile_name='adya_dev')
cloudwatch_client = session.client('events')
lambda_client = session.client('lambda')


# create cloudwatch event
def create_cloudwatch_event(cloudwatch_event_name, cron_expression):
    # Put an event rule
    response = cloudwatch_client.put_rule(
        Name=cloudwatch_event_name,
        ScheduleExpression="cron(* * * ? * *)",
        State='ENABLED'
    )
    print (" create_cloudwatch_event : response : ", response)
    if response:
        return attach_cloudwatch_event_to_target(cloudwatch_event_name)
    else:
        return "failed in creating cloudwatch event"


def attach_cloudwatch_event_to_target(cloudwatch_event_name):
    function_name = LAMBDA_FUNCTION_NAME_FOR_CRON
    get_function = get_lambda_function_info(function_name)
    if get_function:
        arn = get_function['Configuration']['FunctionArn']
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

        print response
    else:
        return "failed in getting lambda function info"


def get_lambda_function_info(function_name):
    response = lambda_client.get_function(
        FunctionName=function_name
    )
    print ("lambda response ", response)
    return response

