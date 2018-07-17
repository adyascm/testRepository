from adya.common.constants import constants
from adya.slack.policy_validator import policy_validator_permission_change, policy_validator_token_activity, \
    policy_validator_new_user


def validate_policy(auth_token, datasource_id, policy_trigger, payload):

    if policy_trigger == constants.PolicyTriggerType.PERMISSION_CHANGE.value:
        policy_validator_permission_change.validate_permission_change(auth_token, datasource_id, payload)
    elif policy_trigger == constants.PolicyTriggerType.APP_INSTALL.value:
        policy_validator_token_activity.validate_token_activity(auth_token, datasource_id, payload)
    elif policy_trigger == constants.PolicyTriggerType.NEW_USER.value:
        policy_validator_new_user.validate_new_user(auth_token, datasource_id, payload)