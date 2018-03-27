import uuid

from sqlalchemy import and_, or_

from adya.common import constants, messaging
from adya.controllers import domain_controller, common
from adya.db.connection import db_connection
from adya.db.models import Policy, LoginUser, PolicyTrigger, PolicyCondition

def get_policies(auth_token):
    db_session = db_connection().get_session()=
    existing_user = common.get_user_session(auth_token, db_session=db_session)
    #TODO: add the logged in user's datasources filter
    return db_session.query(Policy).all()

def create_policy(auth_token, payload):
    db_session = db_connection().get_session()
    existing_user = common.get_user_session(auth_token, db_session=db_session)
    if payload:
        policy_id = str(uuid.uuid4())
        # inserting data into policy table
        policy = Policy
        policy.policy_id = policy_id
        policy.datasource_id = payload["datasource_id"]
        policy.name = payload["name"]
        policy.description = payload["description"]
        policy.trigger_type = payload["trigger_type"]
        db_session.add(policy)

        # inserting data into policy conditions table
        conditions = payload["conditions"]
        for condition in conditions:
            policy_condition = PolicyCondition
            policy_condition.policy_id = policy_id
            policy_condition.datasource_id = payload["datasource_id"]
            policy_condition.match_type = condition["match_type"]
            policy_condition.match_condition = condition["match_condition"]
            policy_condition.match_value = condition["match_value"]
            db_session.add(policy_condition)

        # inserting data into policy actions table
        actions = payload["actions"]
        for action in actions:
            policy_action = PolicyAction
            policy_action.policy_id = policy_id
            policy_action.datasource_id = payload["datasource_id"]
            policy_action.action_type = action["action_type"]
            policy_action.config = action["config"]
            db_session.add(policy_action)

        db_connection().commit()
        return policy

    return None

def validate(auth_token, datasource_id, resource_id, payload):
    old_permissions = payload["old_permissions"]
    old_permissions_map = {}
    for permission in old_permissions:
        old_permissions_map[permission.email] = permission

    resource = payload["resource"]
    new_permissions = resource["permissions"]
    for new_permission in new_permissions:
        if (not new_permission.email in old_permissions_map) or 
            (not old_permissions_map[new_permission.email].permission_type == new_permission.permission_type):
            print "Permissions changed for this document, validate other policy conditions now..."
            policies = db_session.query(Policy).filter(and_(Policy.datasource_id == datasource_id, 
                Policy.trigger_type == constants.PolicyTriggerType.PERMISSION_CHANGE)).all()
            if not policies or len(policies) < 1:
                print "No policies found for permission change trigger, ignoring..."
                return

            for policy in policies:
                validate_resource_permission_change_policy(policy, resource)
            return
    return

def validate_resource_permission_change_policy(policy, resource):
    policy_conditions = policy.conditions
    

# def policy_check_for_specific_user(actor_id, actor_name, affected_entity_id, affected_entity_name,  action_type, db_session):

#     try:

#         response = db_session.query(PolicyTrigger.config).filter(and_(Policy.policy_id == PolicyCondition.policy_id,
#                                                                               PolicyCondition.policy_id == PolicyTrigger.policy_id)). \
#             filter(and_(
#                         or_(
#                             and_(PolicyCondition.match_condition == constants.PolicyConditionMatch.CONTAIN,
#                                  PolicyCondition.affected_entity_id.ilike("%" + affected_entity_name + "%")),

#                             and_(PolicyCondition.match_condition == constants.PolicyConditionMatch.EQUAL,
#                                  PolicyCondition.affected_entity_id == affected_entity_id),

#                             and_(PolicyCondition.match_condition == constants.PolicyConditionMatch.NOTEQUAL,
#                                  PolicyCondition.affected_entity_id != affected_entity_id)
#                             ),


#                         or_(
#                              and_(PolicyCondition.actor_match_condition == constants.PolicyConditionMatch.CONTAIN,
#                                   PolicyCondition.actor_id.ilike("%" + actor_name + "%")),

#                              and_(PolicyCondition.actor_match_condition == constants.PolicyConditionMatch.EQUAL,
#                                   PolicyCondition.actor_id == actor_id),

#                              and_(PolicyCondition.actor_match_condition == constants.PolicyConditionMatch.NOTEQUAL,
#                                   PolicyCondition.actor_id != actor_id)
#                            ),
#                         PolicyTrigger.action_name == action_type

#                         )
#                  )
#         return response

#     except Exception as e:
#         print e
