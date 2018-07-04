
from adya.github import github_utils
from adya.common.db.connection import db_connection
from adya.github.mappers import entities
from adya.common.db.models import DataSource
from adya.common.constants import constants

def process_activity(auth_token, payload):
    git_client = github_utils.get_github_client(payload["datasource_id"])
    action = payload["action"]
    repository = payload["repository"]
    db_session = db_connection().get_session()
    datasource = db_session.query(DataSource).filter(DataSource.datasource_type == constants.ConnectorTypes.GITHUB.value).first()

    if action == "created":
        # Update the Resource table with the new repository
        repo = entities.GithubRepository(datasource.datasource_id, payload)
        repo_model = repo.get_model()
        repo_permission = entities.GithubRepositoryPermission(datasource.datasource_id, payload)
        repo_permission_model = repo_permission.get_model()
        db_session.add(repo_model)
        db_session.add(repo_permission_model)
        db_connection().commit()
    