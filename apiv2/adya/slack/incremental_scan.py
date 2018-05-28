from adya.common.utils.response_messages import Logger


def process_notifications(payload):
    Logger().info("process_slack_notifications : payload : {}".format(payload))
    event_type = payload["type"]
    if event_type == "url_verification":
        challenge_token = payload["challenge"]
        return challenge_token
