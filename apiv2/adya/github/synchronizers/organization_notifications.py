
from adya.github import github_constants
from adya.common.db.activity_db import activity_db
from adya.common.db.connection import db_connection
from adya.common.db.models import DataSource
from adya.common.constants import constants

def process_activity(payload, event_type):
    db_session = db_connection().get_session()
    datasource = db_session.query(DataSource).filter(DataSource.datasource_type == constants.ConnectorTypes.GITHUB.value).first()
    domain_id = datasource.domain_id

    if event_type == github_constants.GithubNativeEventTypes.ORGANIZATION.value:
        action = payload["action"]

        if action == "member_added":
            activity_db().add_event(domain_id, constants.ConnectorTypes.GITHUB.value, 'ORG_MEMBER_ADDED', None, {})
        elif action == "member_removed":
            activity_db().add_event(domain_id, constants.ConnectorTypes.GITHUB.value, 'ORG_MEMBER_REMOVED', None, {})
        elif action == "member_invited":
            pass