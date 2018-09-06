
from adya.github import github_constants
from adya.github.synchronizers import organization_notifications, repository_notifications, team_notifications
from adya.common.utils.response_messages import Logger, ResponseMessage
import json

def receive_notification(event_type, payload):
    Logger().info("Notification received with event object : {}".format(payload))
    # event_type = fetch_event_type(payload)
    if event_type:
        handler = get_handler(event_type)
        # body = json.loads(payload["body"])
        handler.process_activity(payload, event_type)
        return ResponseMessage(202, "Notification handled successfully")
    else:
        return ResponseMessage(400, "Unable to fetch event type from event payload")

def fetch_event_type(payload):
    #Parse the event type from the header
    headers = payload["headers"]
    try:
        event_type = headers["X-GitHub-Event"]
        return event_type
    except Exception as ex:
        Logger().exception("Exception occured while fetching event type from event payload - {}".format(ex))
        return None

def get_handler(event_type):
    handler = None
    if event_type == github_constants.GithubNativeEventTypes.REPOSITORY.value or \
        event_type == github_constants.GithubNativeEventTypes.REPOSITORY_VULNERABILITY_ALERT.value or \
        event_type == github_constants.GithubNativeEventTypes.FORK.value or \
        event_type == github_constants.GithubNativeEventTypes.MEMBER.value or \
        event_type == github_constants.GithubNativeEventTypes.COMMITCOMMENT.value:
        handler = repository_notifications

    elif event_type == github_constants.GithubNativeEventTypes.ORGANIZATION.value:
        handler = organization_notifications
    
    elif event_type == github_constants.GithubNativeEventTypes.TEAM.value:
        handler = team_notifications

    return handler
