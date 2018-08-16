import json

from adya.common.constants import constants
from adya.common.db.connection import db_connection
from adya.common.db.models import Policy
from sqlalchemy import and_

from adya.common.utils.policy_utils import validate_new_user_policy
from adya.common.utils.response_messages import Logger


def validate_new_user(auth_token, datasource_id, payload):
    user = json.loads(payload["user"])
    group_name = payload.get("group_name")
    db_session = db_connection().get_session()
    policies = db_session.query(Policy).filter(and_(Policy.datasource_id == datasource_id,
                                                    Policy.trigger_type == constants.PolicyTriggerType.NEW_USER.value,
                                                    Policy.is_active == True)).all()
    if not policies or len(policies) < 1:
        Logger().info("No policies found for new user trigger, ignoring...")
        return
    for policy in policies:
        validate_new_user_policy(db_session, auth_token, datasource_id, policy, user, group_name)
    return
