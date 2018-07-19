import json

from adya.common.constants import constants, urls, action_constants
from adya.common.constants.action_constants import datasource_execute_action_map, connector_servicename_map
from adya.common.db.db_utils import get_datasource
from adya.common.db.models import alchemy_encoder
from adya.common.email_templates import adya_emails
from adya.common.utils import messaging
from adya.common.utils.response_messages import Logger


# check for apps installed policy violation
from adya.core.controllers.actions_controller import remove_app_for_domain


def validate_apps_installed_policy(db_session, auth_token, datasource_id, policy, application):
    Logger().info("validating_policy : application : {}".format(application))
    is_violated = 1
    for policy_condition in policy.conditions:
        if policy_condition.match_type == constants.PolicyMatchType.APP_NAME.value:
            is_violated = is_violated & check_value_violation(policy_condition, application["display_text"])
        elif policy_condition.match_type == constants.PolicyMatchType.APP_RISKINESS.value:
            is_violated = is_violated & check_value_violation(policy_condition, application["score"])

    if is_violated:
        Logger().info("Policy \"{}\" is violated, so triggering corresponding actions".format(policy.name))
        for action in policy.actions:
            if action.action_type == constants.PolicyActionType.SEND_EMAIL.value:
                to_address = json.loads(action.config)["to"]
                adya_emails.send_app_install_policy_violate_email(to_address, policy, application)
            elif action.action_type == constants.PolicyActionType.REVERT.value:
                remove_app_for_domain(auth_token, application["id"])

        payload = {}
        payload["datasource_id"] = datasource_id
        payload["name"] = policy.name
        payload["policy_id"] = policy.policy_id
        payload["severity"] = policy.severity
        payload[
            "description_template"] = "New app install \"{{display_text}}\" for \"{{user_email}}\" has violated policy \"{{policy_name}}\""
        payload["payload"] = application
        messaging.trigger_post_event(urls.ALERTS_PATH, auth_token, None, payload)

# check file permission change policy violation
def validate_permission_change_policy(db_session, auth_token, datasource_id, policy, resource, new_permissions):
    Logger().info("validating_policy : resource : {} , new permission : {} ".format(resource, new_permissions))
    is_policy_violated = False
    violated_permissions = []
    new_permissions_left = []
    for permission in new_permissions:
        is_permission_violated = 1
        for policy_condition in policy.conditions:
            if policy_condition.match_type == constants.PolicyMatchType.DOCUMENT_NAME.value:
                is_permission_violated = is_permission_violated & check_value_violation(policy_condition, resource["resource_name"])
            elif policy_condition.match_type == constants.PolicyMatchType.DOCUMENT_OWNER.value:
                is_permission_violated = is_permission_violated & check_value_violation(policy_condition, resource["resource_owner_id"])
            elif policy_condition.match_type == constants.PolicyMatchType.DOCUMENT_EXPOSURE.value:
                is_permission_violated = is_permission_violated & check_value_violation(policy_condition, permission["exposure_type"])
            elif policy_condition.match_type == constants.PolicyMatchType.PERMISSION_EMAIL.value:
                is_permission_violated = is_permission_violated & check_value_violation(policy_condition, permission["email"])

        if is_permission_violated:
            is_policy_violated = True
            if not permission["permission_type"] == constants.Role.OWNER.value:
                violated_permissions.append(permission)
            else:
                new_permissions_left.append(permission)



    send_email_action = []
    check_if_revert_action = False
    if is_policy_violated:
        Logger().info("Policy \"{}\" is violated, so triggering corresponding actions".format(policy.name))
        for action in policy.actions:
            if action.action_type == constants.PolicyActionType.SEND_EMAIL.value:
                send_email_action.append(action)
            elif action.action_type == constants.PolicyActionType.REVERT.value and len(violated_permissions)>0:
                Logger().info("violated permissions : {}".format(violated_permissions))
                check_if_revert_action = True
                datasource_obj = get_datasource(datasource_id)
                datasource_type = datasource_obj.datasource_type
                body = json.dumps(violated_permissions, cls=alchemy_encoder())
                payload = {"permissions": body, "datasource_id": datasource_id,
                           "domain_id": datasource_obj.domain_id,
                           "user_email": resource["resource_owner_id"],
                           "action_type": action_constants.ActionNames.REMOVE_EXTERNAL_ACCESS_TO_RESOURCE.value}
                response = messaging.trigger_post_event(datasource_execute_action_map[datasource_type], auth_token,
                                                             None, payload, connector_servicename_map[datasource_type],
                                                             constants.TriggerType.SYNC.value)
                if response and not response.response_code == constants.SUCCESS_STATUS_CODE:
                    violated_permissions = []

        if len(send_email_action) > 0:
            to_address = json.loads(send_email_action[0].config)["to"]
            Logger().info("validate_policy : send email")
            new_permissions_left = []
            if not check_if_revert_action:
                violated_permissions = None
            adya_emails.send_permission_change_policy_violate_email(to_address, policy, resource, new_permissions,
                                                                    violated_permissions, new_permissions_left)

        payload = {}
        payload["datasource_id"] = datasource_id
        payload["name"] = policy.name
        payload["policy_id"] = policy.policy_id
        payload["severity"] = policy.severity
        payload[
            "description_template"] = "Permission changes on {{resource_owner_id}}'s document \"{{resource_name}}\" has violated policy \"{{policy_name}}\""
        payload["payload"] = resource
        messaging.trigger_post_event(urls.ALERTS_PATH, auth_token, None, payload)

# generic function for matching policy condition and corresponding value
def check_value_violation(policy_condition, value):
    if (policy_condition.match_condition == constants.PolicyConditionMatch.EQUAL.value and policy_condition.match_value == value) or \
            (policy_condition.match_condition == constants.PolicyConditionMatch.NOTEQUAL.value and policy_condition.match_value != value):
        return 1
    elif policy_condition.match_condition == constants.PolicyConditionMatch.CONTAIN.value and policy_condition.match_value in value:
        return 1
    elif policy_condition.match_condition == constants.PolicyConditionMatch.GREATER.value and policy_condition.match_value < value:
        return 1
    return 0


def validate_new_user_policy(db_session, auth_token, datasource_id, policy, user):
    Logger().info("validating_policy for new user : {} ".format(user))
    is_violated = 1
    for policy_condition in policy.conditions:
        if policy_condition.match_type == constants.PolicyMatchType.USER_TYPE.value:
            is_violated = is_violated & check_value_violation(policy_condition, user['member_type'])
        elif policy_condition.match_type == constants.PolicyMatchType.USER_ROLE.value:
            if policy_condition.match_value == 'Admin':
                policy_condition.match_value = True
            else:
                policy_condition.match_value = False
            is_violated = is_violated & check_value_violation(policy_condition, user['is_admin'])

    if is_violated:
        Logger().info("Policy \"{}\" is violated, so triggering corresponding actions".format(policy.name))
        for action in policy.actions:
            if action.action_type == constants.PolicyActionType.SEND_EMAIL.value:
                to_address = json.loads(action.config)["to"]
                # TODO: add proper email template
                Logger().info("validate_policy : send email")
                adya_emails.send_new_user_policy_violate_email(to_address, policy, user)

        payload = {}
        payload["datasource_id"] = datasource_id
        payload["name"] = policy.name
        payload["policy_id"] = policy.policy_id
        payload["severity"] = policy.severity
        payload["description_template"] = "New user {{user_email}} added has violated policy \"{{policy_name}}\""
        payload["payload"] = user
        messaging.trigger_post_event(urls.ALERTS_PATH, auth_token, None, payload)





