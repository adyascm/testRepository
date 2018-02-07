import boto3

cloudwatch_events = boto3.client('events')


# create cloudwatch event
def create_cloudwatch_event(cloudwatch_event_name, cron_expression):
    # Put an event rule
    response = cloudwatch_events.put_rule(
        Name=cloudwatch_event_name,
        ScheduleExpression=cron_expression,
        State='ENABLED'
    )

    if response:
        return attach_cloudwatch_event_to_target(cloudwatch_event_name)
    else:
        return "failed in creating cloudwatch event"


def attach_cloudwatch_event_to_target(cloudwatch_event_name):
    # Adds the specified targets to the specified rule
    response = cloudwatch_events.put_targets(
        Rule=cloudwatch_event_name,
        Targets=[
            # {
            #     'Arn': 'LAMBDA_FUNCTION_ARN',
            #     'Id': 'myCloudWatchEventsTarget',
            # }
        ]
    )

    print response
