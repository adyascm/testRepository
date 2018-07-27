
from adya.github import github_constants

def process_activity(auth_token, payload, event_type):

    if event_type == github_constants.NotificationEvents.ORGANIZATION.value:
        action = payload["action"]

        if action == "member_added":
            pass
        elif action == "member_removed":
            pass
        elif action == "member_invited":
            pass