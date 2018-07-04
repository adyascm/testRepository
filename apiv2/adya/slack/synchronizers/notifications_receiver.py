from adya.slack import slack_utils, slack_constants
import file_notifications
import channel_notifications
import user_notifications
import team_notifications


def receive_notifications(payload):
    callback_type = payload["type"]
    if callback_type == "url_verification":
        challenge_token = payload["challenge"]
        return {"challenge": challenge_token}

    elif callback_type == "event_callback":
        event_type = payload["event"]["type"]
        handler = get_handler(event_type)
        handler.process_activity(payload)


def get_handler(event_type):
    handler = None
    if event_type == slack_constants.NotificationEvents.FILE_CHANGED.value or \
                    event_type == slack_constants.NotificationEvents.FILE_SHARED.value:
        handler = file_notifications
    elif event_type == slack_constants.NotificationEvents.USER_CHANGED.value:
        handler = user_notifications
    elif event_type == slack_constants.NotificationEvents.CHANNEL_ARCHIVE.value or \
            event_type == slack_constants.NotificationEvents.CHANNEL_UNARCHIVE.value or \
            event_type == slack_constants.NotificationEvents.CHANNEL_HISTORY_CHANGED.value or \
            event_type == slack_constants.NotificationEvents.CHANNEL_RENAME.value or \
            event_type == slack_constants.NotificationEvents.CHANNEL_CREATED.value or \
            event_type == slack_constants.NotificationEvents.GROUP_ARCHIVE.value or \
            event_type == slack_constants.NotificationEvents.GROUP_UNARCHIVE.value or \
            event_type == slack_constants.NotificationEvents.GROUP_RENAME.value or \
            event_type == slack_constants.NotificationEvents.MEMBER_JOINED_CHANNEL.value or \
            event_type == slack_constants.NotificationEvents.MEMBER_LEFT_CHANNEL.value or \
            event_type == slack_constants.NotificationEvents.SUBTEAM_CREATED.value or \
            event_type == slack_constants.NotificationEvents.SUBTEAM_UPDATED.value or \
            event_type == slack_constants.NotificationEvents.SUBTEAM_MEMBERS_CHANGED.value:
        handler = channel_notifications
    elif event_type == slack_constants.NotificationEvents.TEAM_JOIN.value:
        handler = team_notifications
    return handler


