import datetime
from sqlalchemy import and_

from adya.common.constants import urls, constants
from adya.common.db.connection import db_connection
from adya.common.db.models import DataSource, DatasourceScanners
from adya.common.utils import messaging
from adya.slack import slack_utils, slack_constants
import file_notifications
import channel_notifications
import user_notifications
import team_notifications


def receive_notifications(payload):
    callback_type = payload["type"]
    if callback_type == "url_verification":
        challenge_token = payload["challenge"]
        return {"challenge": challenge_token}

    elif callback_type == "event_callback":
        event_type = payload["event"]["type"]
        handler = get_handler(event_type)
        handler.process_activity(payload)

    team_id = payload["team_id"] if 'team_id' in payload else None
    if team_id:
        db_session = db_connection().get_session()
        slack_datasource = db_session.query(DataSource).filter(and_(DataSource.source_id == team_id,
                                    DataSource.datasource_type == constants.ConnectorTypes.SLACK.value)).first()

        if slack_datasource:
            datasource_scanner = db_session.query(DatasourceScanners).filter(and_(DatasourceScanners.scanner_type ==
                                    slack_constants.ScannerTypes.USERS.value, DatasourceScanners.datasource_id == slack_datasource.datasource_id)).first()
            last_updated_at = datasource_scanner.updated_at
            six_hours_ago = datetime.datetime.utcnow() - datetime.timedelta(hours=6)
            if last_updated_at < six_hours_ago:
                datasource_scanner.updated_at = datetime.datetime.utcnow()
                query_param = {'datasource_id': datasource_scanner.datasource_id}
                messaging.trigger_get_event(urls.SLACK_ACCESSLOGS, constants.INTERNAL_SECRET, query_param, constants.ConnectorTypes.SLACK.value)

            db_connection().commit()


def get_handler(event_type):
    handler = None
    if event_type == slack_constants.NotificationEvents.FILE_CHANGED.value or \
                    event_type == slack_constants.NotificationEvents.FILE_SHARED.value:
        handler = file_notifications
    elif event_type == slack_constants.NotificationEvents.USER_CHANGED.value:
        handler = user_notifications
    elif event_type == slack_constants.NotificationEvents.CHANNEL_ARCHIVE.value or \
            event_type == slack_constants.NotificationEvents.CHANNEL_UNARCHIVE.value or \
            event_type == slack_constants.NotificationEvents.CHANNEL_HISTORY_CHANGED.value or \
            event_type == slack_constants.NotificationEvents.CHANNEL_RENAME.value or \
            event_type == slack_constants.NotificationEvents.CHANNEL_CREATED.value or \
            event_type == slack_constants.NotificationEvents.GROUP_ARCHIVE.value or \
            event_type == slack_constants.NotificationEvents.GROUP_UNARCHIVE.value or \
            event_type == slack_constants.NotificationEvents.GROUP_RENAME.value or \
            event_type == slack_constants.NotificationEvents.MEMBER_JOINED_CHANNEL.value or \
            event_type == slack_constants.NotificationEvents.MEMBER_LEFT_CHANNEL.value or \
            event_type == slack_constants.NotificationEvents.SUBTEAM_CREATED.value or \
            event_type == slack_constants.NotificationEvents.SUBTEAM_UPDATED.value or \
            event_type == slack_constants.NotificationEvents.SUBTEAM_MEMBERS_CHANGED.value:
        handler = channel_notifications
    elif event_type == slack_constants.NotificationEvents.TEAM_JOIN.value:
        handler = team_notifications
    return handler


