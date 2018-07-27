
from adya.github import github_utils, github_constants
from adya.common.db.connection import db_connection
from adya.github.mappers import entities
from adya.common.db.models import DataSource, Resource
from adya.common.constants import constants

def process_activity(auth_token, payload, event_type):
    git_client = github_utils.get_github_client(payload["datasource_id"])
    # action = payload["action"]
    # repository = payload["repository"]
    db_session = db_connection().get_session()
    datasource = db_session.query(DataSource).filter(DataSource.datasource_type == constants.ConnectorTypes.GITHUB.value).first()

    if event_type == github_constants.NotificationEvents.REPOSITORY.value:
        action = payload["action"]
        if action == "created":
            # Update the Resource table with the new repository
            repo = entities.GithubRepository(datasource.datasource_id, payload)
            repo_model = repo.get_model()
            repo_permission = entities.GithubRepositoryPermission(datasource.datasource_id, payload)
            repo_permission_model = repo_permission.get_model()
            db_session.add(repo_model)
            db_session.add(repo_permission_model)
            db_connection().commit()

        elif action == "archived":
            pass

        elif action == "unarchived":
            pass
        
        elif action == "publicized":
            # Update the Repository as public in the Resource table
            db_session.query(Resource).filter(Resource.datasource_id == datasource.datasource_id, Resource.resource_id == payload["id"]). \
                update({ Resource.exposure_type == constants.EntityExposureType.PUBLIC.value })
            db_connection().commit()

        elif action == "privatized":
            pass

    elif event_type == github_constants.NotificationEvents.REPOSITORY_VULNERABILITY_ALERT.value:
        action = payload["action"]
        if action == "create":
            pass
        elif action == "dismiss":
            pass
        elif action == "resolve":
            pass

    elif event_type == github_constants.NotificationEvents.FORK.value:
        forkee = payload["forkee"]
        repository payload["repository"]
        # Need to handle repository fork 
    

    