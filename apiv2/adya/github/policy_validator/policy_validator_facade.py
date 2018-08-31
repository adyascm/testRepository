
from adya.common.constants import constants
from adya.github.policy_validator import policy_validator_permission_change, policy_validator_new_user
from adya.common.utils.response_messages import Logger

def validate_policy(auth_token, datasource_id, policy_trigger, payload):
    Logger().info("Validating policy for trigger_type : {}".format(policy_trigger))
    if policy_trigger == constants.PolicyTriggerType.PERMISSION_CHANGE.value:
        policy_validator_permission_change.validate_permission_change(auth_token, datasource_id, payload)
    elif policy_trigger == constants.PolicyTriggerType.NEW_USER.value:
        policy_validator_new_user.validate_new_user(auth_token, datasource_id, payload)