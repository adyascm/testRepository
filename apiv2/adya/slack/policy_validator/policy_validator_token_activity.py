import json
from sqlalchemy import and_

from adya.common.constants import constants
from adya.common.db.models import Policy
from adya.common.utils.response_messages import Logger
from adya.common.db.connection import db_connection
from adya.common.utils.policy_utils import validate_apps_installed_policy


def validate_token_activity(auth_token, datasource_id, payload):
    application = json.loads(payload["application"])
    db_session = db_connection().get_session()
    policies = db_session.query(Policy).filter(and_(Policy.datasource_id == datasource_id,
                                                    Policy.trigger_type == constants.PolicyTriggerType.APP_INSTALL.value,
                                                    Policy.is_active == True)).all()
    if not policies or len(policies) < 1:
        Logger().info("No policies found for permission change trigger, ignoring...")
        return
    for policy in policies:
        validate_apps_installed_policy(db_session, auth_token, datasource_id, policy, application)
    return

