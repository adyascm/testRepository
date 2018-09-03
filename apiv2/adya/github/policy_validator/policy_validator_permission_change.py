
from adya.common.utils.response_messages import Logger
from adya.common.db.db_utils import db_connection, get_datasource
from adya.common.db.connection import db_connection
from adya.common.db.models import Policy
from adya.common.constants import constants
from adya.common.utils.policy_utils import validate_permission_change_policy
import json

def validate_permission_change(auth_token, datasource_id, payload):
    Logger().info("Validating policy for file permission change")
    action = payload["action"]
    resource = json.loads(payload["resource"])
    new_permissions = json.loads(payload["new_permissions"])
    has_permission_changed = False

    if action == "publicized":
        has_permission_changed = True

    if has_permission_changed:
        Logger().info("Permissions changed for the repository, validate policy conditions now...")
        db_session = db_connection().get_session()
        policies = db_session.query(Policy).filter(Policy.datasource_id == datasource_id,
                                                    Policy.trigger_type == constants.PolicyTriggerType.PERMISSION_CHANGE.value,
                                                    Policy.is_active == True).all()
        
        if not policies or len(policies) < 1:
            Logger().info("No policies found for permission change trigger, ignoring...")
            return
        datasource_obj = get_datasource(datasource_id)
        for policy in policies:
            validate_permission_change_policy(db_session, auth_token, datasource_obj, policy, resource, new_permissions)
    return