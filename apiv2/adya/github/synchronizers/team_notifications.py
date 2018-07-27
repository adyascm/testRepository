
from adya.github import github_constants

def process_activity(auth_token, payload, event_type):
    
    if event_type == github_constants.NotificationEvents.TEAM.value:
        action = payload["action"]

        if action == "created":
            pass
        elif action == "deleted":
            pass
