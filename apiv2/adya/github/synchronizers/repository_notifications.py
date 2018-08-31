
from adya.github import github_utils, github_constants
from adya.common.db.connection import db_connection
from adya.github.mappers import entities
from adya.common.db.models import DataSource, Resource, ResourcePermission, DomainUser, alchemy_encoder
from adya.common.constants import constants, urls
from adya.common.db.activity_db import activity_db
from adya.common.utils import messaging, utils
from adya.common.utils.response_messages import Logger
import json

def process_activity(payload, event_type):
    db_session = db_connection().get_session()
    datasource = db_session.query(DataSource).filter(DataSource.datasource_type == constants.ConnectorTypes.GITHUB.value).first()
    domain_id = datasource.domain_id
    datasource_id = datasource.datasource_id
    
    if event_type == github_constants.GithubNativeEventTypes.REPOSITORY.value:
        Logger().info("Repository notification received with body: {}".format(payload))
        action = payload["action"]
        repository = payload["repository"]
        owner_id = repository["owner"]["id"]
        repo = entities.GithubRepository(datasource_id, repository)
        repo_model = repo.get_model()
        repo_permission = entities.GithubRepositoryPermission(datasource_id, repository)
        repo_permission_model = repo_permission.get_model()
        existing_permission = db_session.query(ResourcePermission).filter(ResourcePermission.datasource_id == datasource_id, 
            ResourcePermission.resource_id == repository["id"]).all()
        existing_permission = json.dumps(existing_permission, cls=alchemy_encoder())

        if action == "created":
            # Update the Resource table with the new repository
            db_session.add(repo_model)
            db_session.add(repo_permission_model)
            db_connection().commit()
            activity_db().add_event(domain_id, constants.ConnectorTypes.GITHUB.value, 'REP_ADDED', owner_id, {})

        elif action == "archived":
            activity_db().add_event(domain_id, constants.ConnectorTypes.GITHUB.value, 'REP_ARCHIVED', owner_id, {})

        elif action == "unarchived":
            pass
        
        elif action == "publicized":
            # Update the Repository as public in the Resource table
            db_session.query(Resource).filter(Resource.datasource_id == datasource_id, Resource.resource_id == payload["id"]). \
                update({ Resource.exposure_type == constants.EntityExposureType.PUBLIC.value })
            db_connection().commit()
            activity_db().add_event(domain_id, constants.ConnectorTypes.GITHUB.value, 'REP_PUBLIC', owner_id, {})
            # Trigger default policy validate
            policy_params = {"datasource_id": datasource_id, "policy_trigger": constants.PolicyTriggerType.PERMISSION_CHANGE.value}
            permission_change_payload = {}
            permission_change_payload["resource"] = json.dumps(repo_model, cls=alchemy_encoder())
            permission_change_payload["new_permissions"] = json.dumps(repo_permission_model, cls=alchemy_encoder())
            permission_change_payload["old_permissions"] = existing_permission
            permission_change_payload["action"] = action
            messaging.trigger_post_event(urls.GITHUB_POLICIES_VALIDATE_PATH, constants.INTERNAL_SECRET, policy_params, permission_change_payload, "github")
        
        elif action == "privatized":
            pass

    elif event_type == github_constants.GithubNativeEventTypes.REPOSITORY_VULNERABILITY_ALERT.value:
        Logger().info("Repository vulnerability notification received with body: {}".format(payload))
        action = payload["action"]
        if action == "create":
            pass
        elif action == "dismiss":
            pass
        elif action == "resolve":
            pass

    elif event_type == github_constants.GithubNativeEventTypes.FORK.value:
        Logger().info("Repository fork notification received with body: {}".format(payload))
        forkee = payload["forkee"]
        repository = payload["repository"]
        owner_id = forkee["owner"]["id"]
        activity_db().add_event(domain_id, constants.ConnectorTypes.GITHUB.value, 'REP_FORKED', owner_id, {})
    
    elif event_type == github_constants.GithubNativeEventTypes.MEMBER.value:
        Logger().info("Member notification received with body: {}".format(payload))
        action = payload["action"]
        repository = payload["repository"]
        member = payload["member"]
        if action == "added":
            member_id = member["id"]
            existing_user = db_session.query(DomainUser).filter(DomainUser.datasource_id == datasource_id, DomainUser.user_id == member_id).first()
            repo = db_session.query(Resource).filter(Resource.datasource_id == datasource_id, Resource.resource_id == repository["id"]).first()
            if not existing_user:
                user = entities.GithubUser(datasource_id, domain_id, member)
                existing_user = user.get_model()
                db_session.add(existing_user)
                db_connection().commit()
                #Also need to make an entry to the ResourcePermission table
                repo_permission = ResourcePermission()
                repo_permission["datasource_id"] = datasource_id
                repo_permission["resource_id"] = repository["id"]
                repo_permission["email"] = existing_user["email"]
                repo_permission["permission_id"] = member["id"]
                repo_permission["permission_type"] = member["permission_type"]
                repo_permission["exposure_type"] = utils.get_highest_exposure_type(existing_user["member_type"], repo["exposure_type"])
                
                db_session.add(repo_permission)
                db_connection().commit()

            if existing_user.member_type == constants.EntityExposureType.EXTERNAL.value:
                policy_params = {"datasource_id": datasource_id, "policy_trigger": constants.PolicyTriggerType.NEW_USER.value}
                new_user_payload = {}
                new_user_payload["user"] = json.dumps(existing_user, cls=alchemy_encoder())
                new_user_payload["group"] = None
                messaging.trigger_post_event(urls.GITHUB_POLICIES_VALIDATE_PATH, constants.INTERNAL_SECRET, policy_params, new_user_payload, "github")
