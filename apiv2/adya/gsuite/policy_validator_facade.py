from adya.common.constants import constants
from adya.gsuite import policy_validator_permission_change

def validate_policy(auth_token, datasource_id, policy_trigger, payload):

    if policy_trigger == constants.PolicyTriggerType.PERMISSION_CHANGE:
        policy_validator_permission_change.validate_permission_change(auth_token, datasource_id, payload)