import json
import uuid

from sqlalchemy import and_, or_

from adya.common.constants import constants
from adya.common.utils import messaging
from adya.common.utils.response_messages import ResponseMessage
from adya.core.controllers import domain_controller
from adya.gsuite import scan
from adya.common.db.connection import db_connection
from adya.common.db.models import Policy, LoginUser, PolicyCondition, PolicyAction, DataSource
from adya.common.db import db_utils
from adya.common.utils.response_messages import Logger
from adya.common.utils import aws_utils
from adya.common.email_templates import adya_emails


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

        return existing_policy
    else:
        return ResponseMessage(400, "Bad Request - Policy not found")


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
    delete_response = delete_policy(policy_id)
    if delete_response:
        policy = create_policy(auth_token, payload)
        return policy
    else:
        return ResponseMessage(400, "Bad Request - policy does not exist. update failed! ")
    

def validate(auth_token, datasource_id, payload):
    old_permissions = json.loads(payload["old_permissions"])
    new_permissions = payload["new_permissions"]
    old_permissions_map = {}
    for permission in old_permissions:
        old_permissions_map[permission["email"]] = permission

    resource = payload["resource"]
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
                                                        Policy.trigger_type == constants.PolicyTriggerType.PERMISSION_CHANGE)).all()
        if not policies or len(policies) < 1:
            Logger().info("No policies found for permission change trigger, ignoring...")
            return
        for policy in policies:
            validate_policy(db_session, datasource_id, policy, resource, new_permissions)
        return
    return


def validate_policy(db_session, datasource_id, policy, resource, new_permissions):
    is_violated = 1
    for policy_condition in policy.conditions:
        if policy_condition.match_type == constants.PolicyMatchType.DOCUMENT_NAME:
            is_violated = is_violated & check_value_violation(policy_condition, resource["resource_name"])
        elif policy_match_type == constants.PolicyMatchType.DOCUMENT_OWNER:
            is_violated = is_violated & check_value_violation(policy_condition, resource["resource_owner_id"])
        elif policy_match_type == constants.PolicyMatchType.DOCUMENT_EXPOSURE:
            is_violated = is_violated & check_value_violation(policy_condition, resource["exposure_type"])
        elif policy_match_type == constants.PolicyMatchType.PERMISSION_EMAIL:
            is_permission_violated = 0
            for permission in new_permissions:
                is_permission_violated = is_permission_violated | check_value_violation(policy_condition, permission["email"])
            is_violated = is_violated & is_permission_violated

    if is_violated:
        Logger().info("Policy \"{}\" is violated, so triggering corresponding actions".format(policy.name))
        for action in policy.actions:
            if action.action_type == constants.policyActionType.SEND_EMAIL:
                to_address = json.loads(action.config)["to"]
                #aws_utils.send_email([to_address], "A policy is violated in your GSuite account", "Following policy is violated - {}".format(policy.name))
                adya_emails.send_policy_violate_email(to_address, policy, resource)
        payload = {}
        payload["datasource_id"] = datasource_id
        payload["name"] = policy["name"]
        payload["policy_id"] = policy["policy_id"]
        messaging.trigger_post_event(urls.ALERTS_PATH, payload)

# generic function for matching policy condition and corresponding value
def check_value_violation(policy_condition, value):
    if (policy_condition.match_condition == constants.PolicyConditionMatch.EQUAL and policy_condition.match_value == value) or \
            (policy_condition.match_condition == constants.PolicyConditionMatch.NOTEQUAL and policy_condition.match_value != value):
            return 1
    elif policy_condition.match_condition == constants.PolicyConditionMatch.CONTAIN and policy_condition.match_value in value:
        return 1
    return 0

