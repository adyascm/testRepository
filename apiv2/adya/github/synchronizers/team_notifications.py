
from adya.github import github_constants
from adya.common.db.connection import db_connection
from adya.common.constants import constants
from adya.common.db.activity_db import activity_db
from adya.common.db.models import DataSource

def process_activity(auth_token, payload, event_type):
    db_session = db_connection().get_session()
    datasource = db_session.query(DataSource).filter(DataSource.datasource_type == constants.ConnectorTypes.GITHUB.value).first()
    domain_id = datasource.domain_id

    if event_type == github_constants.GithubNativeEventTypes.TEAM.value:
        action = payload["action"]

        if action == "created":
            activity_db().add_event(domain_id, constants.ConnectorTypes.GITHUB.value, 'TEAM_ADDED', None, {})
        elif action == "deleted":
            activity_db().add_event(domain_id, constants.ConnectorTypes.GITHUB.value, 'TEAM_REMOVED', None, {})
