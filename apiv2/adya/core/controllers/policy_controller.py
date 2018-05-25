import json
import uuid

from sqlalchemy import and_, or_

from adya.common.constants import constants, urls, default_policies
from adya.common.utils.response_messages import ResponseMessage
from adya.common.db.connection import db_connection
from adya.common.db.models import Policy, PolicyCondition, PolicyAction, DataSource
from adya.common.db import db_utils
from adya.common.utils.response_messages import Logger
from adya.core.controllers.alert_controller import delete_alert_for_a_policy

def get_policies(auth_token):
    db_session = db_connection().get_session()
    existing_user = db_utils.get_user_session(auth_token, db_session=db_session)
    user_domain_id = existing_user.domain_id
    is_admin = existing_user.is_admin
    is_service_account_is_enabled = existing_user.is_serviceaccount_enabled

    if is_service_account_is_enabled and is_admin:
        policies = db_session.query(Policy).filter(and_(DataSource.domain_id == user_domain_id,
                                                        Policy.datasource_id == DataSource.datasource_id)).all()

    else:
        policies = db_session.query(Policy).filter(and_(DataSource.domain_id == user_domain_id,
                                                        Policy.datasource_id == DataSource.datasource_id,
                                                        Policy.created_by == existing_user.email)).all()

    return policies


def delete_policy(policy_id):
    db_session = db_connection().get_session()
    existing_policy = db_session.query(Policy).filter(Policy.policy_id == policy_id).first()
    if existing_policy:
        db_session.query(PolicyAction).filter(PolicyAction.policy_id == policy_id).delete()
        db_session.query(PolicyCondition).filter(PolicyCondition.policy_id == policy_id).delete()

        db_session.delete(existing_policy)
        db_connection().commit()


def create_policy(auth_token, payload):
    db_session = db_connection().get_session()
    if payload:
        policy_id = str(uuid.uuid4())
        # inserting data into policy table
        policy = Policy()
        policy.policy_id = policy_id
        policy.datasource_id = payload["datasource_id"]
        policy.name = payload["name"]
        policy.description = payload["description"]
        policy.trigger_type = payload["trigger_type"]
        policy.created_by = payload["created_by"]
        policy.is_active = payload["is_active"]
        db_session.add(policy)

        # inserting data into policy conditions table
        conditions = payload["conditions"]
        for condition in conditions:
            policy_condition = PolicyCondition()
            policy_condition.policy_id = policy_id
            policy_condition.datasource_id = payload["datasource_id"]
            policy_condition.match_type = condition["match_type"]
            policy_condition.match_condition = condition["match_condition"]
            policy_condition.match_value = condition["match_value"]
            db_session.add(policy_condition)

        # inserting data into policy actions table
        actions = payload["actions"]
        for action in actions:
            policy_action = PolicyAction()
            policy_action.policy_id = policy_id
            policy_action.datasource_id = payload["datasource_id"]
            policy_action.action_type = action["action_type"]
            policy_action.config = json.dumps(action["config"])
            db_session.add(policy_action)

        db_connection().commit()
        return policy

    return ResponseMessage(400, "Bad Request - Improper payload")


def update_policy(auth_token, policy_id, payload):
    delete_alert_for_a_policy(policy_id)
    delete_policy(policy_id)
    policy = create_policy(auth_token, payload)
    Logger().info("update_policy :  policy {}".format(policy))
    return policy
    
def create_default_policies(auth_token, datasource_id):
    login_user = db_utils.get_user_session(auth_token).email    
    for policy in default_policies.default_policies:
        policy['datasource_id'] = datasource_id
        if len(policy["actions"]) > 0:
            policy["actions"][0]["config"]["to"] = login_user
        policy["created_by"] = login_user
        create_policy(auth_token, policy)
    return