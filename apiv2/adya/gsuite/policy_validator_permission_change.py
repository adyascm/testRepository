import json
from sqlalchemy import and_

from adya.common.constants import constants, urls
from adya.common.utils import messaging
from adya.common.db.models import Policy, PolicyCondition, PolicyAction, DataSource
from adya.common.utils.response_messages import Logger
from adya.common.utils import aws_utils
from adya.common.email_templates import adya_emails
from adya.common.db.connection import db_connection

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
                                                        Policy.trigger_type == constants.PolicyTriggerType.PERMISSION_CHANGE,
                                                        Policy.is_active == True)).all()
        if not policies or len(policies) < 1:
            Logger().info("No policies found for permission change trigger, ignoring...")
            return
        for policy in policies:
            validate_policy(db_session, auth_token, datasource_id, policy, resource, new_permissions)
        return
    return


def validate_policy(db_session, auth_token, datasource_id, policy, resource, new_permissions):
    Logger().info("validating_policy : resource : {} , new permission : {} ".format(resource, new_permissions))
    is_violated = 1
    for policy_condition in policy.conditions:
        if policy_condition.match_type == constants.PolicyMatchType.DOCUMENT_NAME:
            is_violated = is_violated & check_value_violation(policy_condition, resource["resource_name"])
        elif policy_condition.match_type == constants.PolicyMatchType.DOCUMENT_OWNER:
            is_violated = is_violated & check_value_violation(policy_condition, resource["resource_owner_id"])
        elif policy_condition.match_type == constants.PolicyMatchType.DOCUMENT_EXPOSURE:
            is_violated = is_violated & check_value_violation(policy_condition, resource["exposure_type"])
        elif policy_condition.match_type == constants.PolicyMatchType.PERMISSION_EMAIL:
            is_permission_violated = 0
            for permission in new_permissions:
                is_permission_violated = is_permission_violated | check_value_violation(policy_condition, permission["email"])
            is_violated = is_violated & is_permission_violated

    if is_violated:
        Logger().info("Policy \"{}\" is violated, so triggering corresponding actions".format(policy.name))
        for action in policy.actions:
            if action.action_type == constants.policyActionType.SEND_EMAIL:
                to_address = json.loads(action.config)["to"]
                # TODO: add proper email template
                Logger().info("validate_policy : send email")
                #aws_utils.send_email([to_address], "A policy is violated in your GSuite account", "Following policy is violated - {}".format(policy.name))
                adya_emails.send_policy_violate_email(to_address, policy, resource, new_permissions)
        payload = {}
        payload["datasource_id"] = datasource_id
        payload["name"] = policy.name
        payload["policy_id"] = policy.policy_id
        payload["severity"] = policy.severity
        payload["description_template"] = "Permission changes on {{resource_owner_id}}'s document \"{{resource_name}}\" has violated policy \"{{policy_name}}\""
        payload["payload"] = resource
        messaging.trigger_post_event(urls.ALERTS_PATH, auth_token, None, payload)

# generic function for matching policy condition and corresponding value

def check_value_violation(policy_condition, value):
    if (policy_condition.match_condition == constants.PolicyConditionMatch.EQUAL and policy_condition.match_value == value) or \
            (policy_condition.match_condition == constants.PolicyConditionMatch.NOTEQUAL and policy_condition.match_value != value):
            return 1
    elif policy_condition.match_condition == constants.PolicyConditionMatch.CONTAIN and policy_condition.match_value in value:
        return 1
    return 0
