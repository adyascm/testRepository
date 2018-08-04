import json
from sqlalchemy import and_

from adya.common.constants import constants
from adya.common.db.db_utils import get_datasource
from adya.common.db.models import Policy
from adya.common.utils.response_messages import Logger
from adya.common.db.connection import db_connection
from adya.common.utils.policy_utils import validate_permission_change_policy


def validate_permission_change(auth_token, datasource_id, payload):
    old_permissions = json.loads(payload["old_permissions"])
    new_permissions = json.loads(payload["new_permissions"])
    old_permissions_map = {}
    for permission in old_permissions:
        old_permissions_map[permission["email"]] = permission

    resource = json.loads(payload["resource"])
    has_permission_changed = False
    for new_permission in new_permissions:
        new_permission_email = new_permission["email"]
        Logger().info("Checking new permission - {}".format(new_permission_email))
        if (not new_permission_email in old_permissions_map):
            Logger().info("New permission does not exist in old permissions - {}".format(new_permission_email))
            has_permission_changed = True
        else:
            if (not old_permissions_map[new_permission_email]["permission_type"] == new_permission["permission_type"]):
                Logger().info("New permission is not same as old permission - {}".format(new_permission_email))
                has_permission_changed = True
            del old_permissions_map[new_permission_email]

    if not has_permission_changed and old_permissions_map:
        Logger().info("Old permissions were more than new permissions")
        has_permission_changed = True
            
    if has_permission_changed:
        Logger().info("Permissions changed for this document, validate policy conditions now...")
        db_session = db_connection().get_session()
        policies = db_session.query(Policy).filter(and_(Policy.datasource_id == datasource_id,
                                                        Policy.trigger_type == constants.PolicyTriggerType.PERMISSION_CHANGE.value,
                                                        Policy.is_active == True)).all()
        if not policies or len(policies) < 1:
            Logger().info("No policies found for permission change trigger, ignoring...")
            return
        datasource_obj = get_datasource(datasource_id)
        for policy in policies:
            validate_permission_change_policy(db_session, auth_token, datasource_obj, policy, resource, new_permissions)
        return
    return


