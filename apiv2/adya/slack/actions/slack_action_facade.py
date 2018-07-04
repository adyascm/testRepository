import json

from adya.common.constants import action_constants, constants
from adya.slack.actions import slack_actions


def execute_slack_actions(auth_token, payload):
    action_type = payload['action_type']
    datasource_id = payload['datasource_id']
    user_email = payload['user_email']
    permissions = json.loads(payload['permissions']) if 'permissions' in payload else None
    initiated_by_email = payload['initiated_by_email'] if 'initiated_by_email' in payload else None
    exceptions = []
    response = None

    if action_type == action_constants.ActionNames.ADD_USER_TO_GROUP.value:
        group_email = payload['group_email']
        response = slack_actions.add_user_to_channel(datasource_id, group_email, user_email)
        response['type'] = 'USER'
        response['role'] = 'MEMBER'
        response['id'] = response['member_id']
    elif action_type == action_constants.ActionNames.REMOVE_USER_FROM_GROUP.value:
        group_email = payload['group_email']
        response = slack_actions.delete_user_from_channel(datasource_id, group_email, user_email)
    elif action_type == action_constants.ActionNames.REMOVE_EXTERNAL_ACCESS_TO_RESOURCE.value or \
                    action_type == action_constants.ActionNames.REMOVE_EXTERNAL_ACCESS.value:
        slack_action = slack_actions.Actions(datasource_id, permissions, initiated_by_email)
        response = slack_action.delete_public_and_external_sharing_for_file()
        exceptions = slack_action.get_exception_messages()

    if len(exceptions) > 0 or (response and response['ok'] != True):
        response['action_status'] = constants.ResponseType.ERROR.value
    else:
        response['action_status'] = constants.ResponseType.SUCCESS.value

    return response



