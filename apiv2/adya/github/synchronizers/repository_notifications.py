
from adya.github import github_utils, github_constants
from adya.common.db.connection import db_connection
from adya.github.mappers import entities
from adya.common.db.models import DataSource, Resource
from adya.common.constants import constants
from adya.common.db.activity_db import activity_db

def process_activity(auth_token, payload, event_type):
    git_client = github_utils.get_github_client(payload["datasource_id"])
    # action = payload["action"]
    # repository = payload["repository"]
    db_session = db_connection().get_session()
    datasource = db_session.query(DataSource).filter(DataSource.datasource_type == constants.ConnectorTypes.GITHUB.value).first()
    domain_id = datasource.domain_id

    if event_type == github_constants.GithubNativeEventTypes.REPOSITORY.value:
        action = payload["action"]
        repository = payload["repository"]
        owner_id = repository["owner"]["id"]
        if action == "created":
            # Update the Resource table with the new repository
            repo = entities.GithubRepository(datasource.datasource_id, payload)
            repo_model = repo.get_model()
            repo_permission = entities.GithubRepositoryPermission(datasource.datasource_id, payload)
            repo_permission_model = repo_permission.get_model()
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
            db_session.query(Resource).filter(Resource.datasource_id == datasource.datasource_id, Resource.resource_id == payload["id"]). \
                update({ Resource.exposure_type == constants.EntityExposureType.PUBLIC.value })
            db_connection().commit()
            activity_db().add_event(domain_id, constants.ConnectorTypes.GITHUB.value, 'REP_PUBLIC', owner_id, {})

        elif action == "privatized":
            pass

    elif event_type == github_constants.GithubNativeEventTypes.REPOSITORY_VULNERABILITY_ALERT.value:
        action = payload["action"]
        if action == "create":
            pass
        elif action == "dismiss":
            pass
        elif action == "resolve":
            pass

    elif event_type == github_constants.GithubNativeEventTypes.FORK.value:
        forkee = payload["forkee"]
        repository = payload["repository"]
        owner_id = forkee["owner"]["id"]
        activity_db().add_event(domain_id, constants.ConnectorTypes.GITHUB.value, 'REP_FORKED', owner_id, {})
    

    