import uuid

from adya.db.connection import db_connection
from adya.db.models import Policy, LoginUser, PolicyTrigger, PolicyCondition, PolicyAction


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
        return  payload