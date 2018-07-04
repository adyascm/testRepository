
from adya.github import github_constants
from adya.github.synchronizers import organization_notifications, repository_notifications, team_notifications

def receive_notification(auth_token, payload):
    event_type = payload["type"]
    handler = get_handler(event_type)
    handler.process_activity(auth_token, payload)


def get_handler(event_type):
    handler = None
    if event_type == github_constants.NotificationEvents.REPOSITORY.value:
        handler = repository_notifications

    elif event_type == github_constants.NotificationEvents.ORGANIZATION.value:
        handler = organization_notifications
    
    elif event_type == github_constants.NotificationEvents.TEAM.value:
        handler = team_notifications

    return handler
