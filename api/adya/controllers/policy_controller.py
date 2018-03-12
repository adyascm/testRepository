import uuid

from sqlalchemy import and_, or_

from adya.common import constants, messaging
from adya.controllers import domain_controller
from adya.db.connection import db_connection
from adya.db.models import Policy, LoginUser, PolicyTrigger, PolicyCondition


def create_policy(auth_token, payload):
    db_session = db_connection().get_session()
    policy_id = str(uuid.uuid4())
    if not auth_token:
        return

    existing_user = db_session.query(LoginUser).filter(LoginUser.auth_token == auth_token).first()
    if payload:

        # inserting data into policy table
        policy = Policy
        policy.policy_id = policy_id
        policy.datasource_id = payload["datasource_id"]
        policy.doamin_id = existing_user.domain_id
        policy.name = payload["name"]

        db_session.add(policy)
        # inserting data into policy trigger table
        action_name = payload["action_name"]
        policy_trigger = PolicyTrigger
        policy_trigger.policy_id = policy_id
        policy_trigger.action_name = action_name
        policy_trigger.config = payload["config"]

        db_session.add(policy_trigger)
        # inserting data into policy condition table
        actor_id = "any"
        actor_match_condition = ""
        policy_condition = PolicyCondition
        policy_condition.policy_id = policy_id
        policy_condition.affected_entity_id = payload["affacted_entitiy_id"]
        policy_condition.affected_entity_type = payload["affected_entity_type"]
        policy_condition.match_condition = payload["match_condition"]
        if "actor_id" in payload:
            actor_id = payload['actor_id']
            actor_match_condition = payload["actor_match_condition"]

        policy_condition.actor_id = actor_id
        policy_condition.actor_match_condition = actor_match_condition

        db_session.add(policy_condition)

        try:
            db_session.commit()
        except Exception as ex:
            print (ex)
        return payload


def policy_checker(auth_token, payload, db_session):
    # user_group_tree = messaging.trigger_post_event(constants.GET_USER_GROUP_TREE_PATH, auth_token, None, None)
    user_and_parents_email = [] #TODO : to get user and parent relationships.
    response_obj = []
    for email in user_and_parents_email:
        response = policy_check_for_specific_user(email, payload['affected_entity_id'], payload['action_type'],auth_token, db_session)
        response_obj.append(response)

'''
For every actor_id try to get the configs for all the policies that match the affected_entity_id and action_type
'''


def policy_check_for_specific_user(actor_id, affected_entity_id, action_type, auth_token, db_session):

    try:

        response = db_session.query(PolicyTrigger.config).filter(and_(Policy.policy_id == PolicyCondition.policy_id,
                                                                              PolicyCondition.policy_id == PolicyTrigger.policy_id)). \
            filter(and_(
                        or_(
                            and_(PolicyCondition.match_condition == constants.PolicyConditionMatch.CONTAIN,
                                 PolicyCondition.affected_entity_id.ilike("%" + affected_entity_id + "%")), #TODO: to decide whether we are gonna use id or name

                            and_(PolicyCondition.match_condition == constants.PolicyConditionMatch.EQUAL,
                                 PolicyCondition.affected_entity_id == affected_entity_id),

                            and_(PolicyCondition.match_condition == constants.PolicyConditionMatch.NOTEQUAL,
                                 PolicyCondition.affected_entity_id != affected_entity_id)
                            ),


                        or_(
                             and_(PolicyCondition.actor_match_condition == constants.PolicyConditionMatch.CONTAIN,
                                  PolicyCondition.actor_id.ilike("%" + actor_id + "%")),

                             and_(PolicyCondition.actor_match_condition == constants.PolicyConditionMatch.EQUAL,
                                  PolicyCondition.actor_id == actor_id),

                             and_(PolicyCondition.actor_match_condition == constants.PolicyConditionMatch.NOTEQUAL,
                                  PolicyCondition.actor_id != actor_id)
                           ),
                        PolicyTrigger.action_name == action_type

                        )
                 )
        return response

    except Exception as e:
        print e
