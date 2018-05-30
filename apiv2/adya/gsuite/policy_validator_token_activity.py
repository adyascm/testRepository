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
    application = json.loads(payload["application"])
    db_session = db_connection().get_session()
    policies = db_session.query(Policy).filter(and_(Policy.datasource_id == datasource_id,
                                                    Policy.trigger_type == constants.PolicyTriggerType.APP_INSTALL,
                                                    Policy.is_active == True)).all()
    if not policies or len(policies) < 1:
        Logger().info("No policies found for permission change trigger, ignoring...")
        return
    for policy in policies:
        validate_policy(db_session, auth_token, datasource_id, policy, application)
    return

def validate_policy(db_session, auth_token, datasource_id, policy, application):
    Logger().info("validating_policy : application : {}".format(application))
    is_violated = 1
    for policy_condition in policy.conditions:
        if policy_condition.match_type == constants.PolicyMatchType.APP_NAME:
            is_violated = is_violated & check_value_violation(policy_condition, application["display_text"])
        elif policy_condition.match_type == constants.PolicyMatchType.APP_RISKINESS:
            is_violated = is_violated & check_value_violation(policy_condition, application["score"])

    if is_violated:
        Logger().info("Policy \"{}\" is violated, so triggering corresponding actions".format(policy.name))
        for action in policy.actions:
            if action.action_type == constants.policyActionType.SEND_EMAIL:
                to_address = json.loads(action.config)["to"]
                aws_utils.send_email([to_address], "[Adya] A policy is violated in your GSuite account", "A new app install - {} has violated policy - {}".format(application["display_text"], policy.name))
                #adya_emails.send_policy_violate_email(to_address, policy, resource, new_permissions)
        payload = {}
        payload["datasource_id"] = datasource_id
        payload["name"] = policy.name
        payload["policy_id"] = policy.policy_id
        payload["severity"] = policy.severity
        payload["description_template"] = "New app install \"{{display_text}}\" has violated policy \"{{policy_name}}\""
        payload["payload"] = resource
        messaging.trigger_post_event(urls.ALERTS_PATH, auth_token, None, payload)

# generic function for matching policy condition and corresponding value

def check_value_violation(policy_condition, value):
    if (policy_condition.match_condition == constants.PolicyConditionMatch.EQUAL and policy_condition.match_value == value) or \
            (policy_condition.match_condition == constants.PolicyConditionMatch.NOTEQUAL and policy_condition.match_value != value):
            return 1
    elif policy_condition.match_condition == constants.PolicyConditionMatch.CONTAIN and policy_condition.match_value in value:
        return 1
    elif policy_condition.match_condition == constants.PolicyConditionMatch.GREATER and policy_condition.match_value < value:
        return 1        
    return 0
