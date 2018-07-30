from sqlalchemy import and_

from adya.common.constants import constants
from adya.common.db import db_utils
from adya.common.db.activity_db import activity_db
from adya.common.db.connection import db_connection
from adya.common.db.db_utils import get_datasource
from adya.common.db.models import DataSource, DomainUser, DirectoryStructure, ResourcePermission
from adya.slack import slack_constants
from adya.slack.mappers import entities


def process_activity(payload):
    team_id = payload["team_id"]
    db_session = db_connection().get_session()
    datasource = db_session.query(DataSource).filter(
        and_(DataSource.source_id == team_id, DataSource.datasource_type == constants.ConnectorTypes.SLACK.value)).first()
    if not datasource:
        return

    datasource_id = datasource.datasource_id
    event = payload['event']
    event_type = event["type"]

    if event_type == slack_constants.NotificationEvents.CHANNEL_ARCHIVE.value or \
                    event_type == slack_constants.NotificationEvents.GROUP_ARCHIVE.value:
        process_channel_archive(db_session, datasource_id, event)
    elif event_type == slack_constants.NotificationEvents.CHANNEL_CREATED.value:
        new_channel_created(db_session, datasource_id, event)
    elif event_type == slack_constants.NotificationEvents.CHANNEL_UNARCHIVE.value or \
                    event_type == slack_constants.NotificationEvents.GROUP_UNARCHIVE.value:
        process_channel_unarchive(db_session, datasource_id, event)
    elif event_type == slack_constants.NotificationEvents.CHANNEL_HISTORY_CHANGED.value:
        pass  # TODO : process logic pending
    elif event_type == slack_constants.NotificationEvents.CHANNEL_RENAME.value or \
                    event_type == slack_constants.NotificationEvents.GROUP_RENAME.value:
        process_channel_rename(db_session, datasource_id, event)
    elif event_type == slack_constants.NotificationEvents.MEMBER_JOINED_CHANNEL.value:
        process_member_joined_channel(db_session, datasource_id, event)
    elif event_type == slack_constants.NotificationEvents.MEMBER_LEFT_CHANNEL.value:
        process_member_left_channel(db_session, datasource_id, event)

    db_connection().commit()


# channel and group events processing

def process_channel_archive(db_session, datasource_id, payload):
    channel_id = payload['channel']
    db_session.query(DomainUser).filter(and_(DomainUser.datasource_id == datasource_id,
                                             DomainUser.user_id == channel_id)).update({DomainUser.is_suspended: True})
    datasource_obj = get_datasource(datasource_id)
    if datasource_obj:
        tags = {"channel_id": channel_id}
        activity_db().add_event(domain_id=datasource_obj.domain_id, connector_type=constants.ConnectorTypes.SLACK.value,
                                event_type='CHANNEL_ARCHIVE', actor=None,
                                tags=tags)


def process_channel_unarchive(db_session, datasource_id, payload):
    channel_id = payload['channel']
    db_session.query(DomainUser).filter(and_(DomainUser.datasource_id == datasource_id,
                                             DomainUser.user_id == channel_id)).update({DomainUser.is_suspended: False})
    datasource_obj = get_datasource(datasource_id)
    if datasource_obj:
        tags = {"channel_id": channel_id}
        activity_db().add_event(domain_id=datasource_obj.domain_id, connector_type=constants.ConnectorTypes.SLACK.value,
                                event_type='CHANNEL_UNARCHIVE', actor=None,
                                tags=tags)


def process_channel_rename(db_session, datasource_id, payload):
    channel_info = payload['channel']
    channel_id = channel_info['id']
    new_channel_name = channel_info['name']

    existing_channel_obj = db_session.query(DomainUser).filter(and_(DomainUser.datasource_id == datasource_id,
                                                                    DomainUser.user_id == channel_id)).first()
    old_channel_name = existing_channel_obj.email

    existing_channel_obj.email = new_channel_name
    existing_channel_obj.full_name = new_channel_name

    # update domain directory structure table
    db_session.query(DirectoryStructure).filter(and_(DirectoryStructure.datasource_id == datasource_id,
                                                     DirectoryStructure.parent_email == old_channel_name)). \
        update({DirectoryStructure.parent_email: new_channel_name})

    # update resource permission table
    db_session.query(ResourcePermission).filter(and_(ResourcePermission.datasource_id == datasource_id,
                                                     ResourcePermission.email == old_channel_name)). \
        update({ResourcePermission.email == new_channel_name})


def new_channel_created(db_session, datasource_id, payload):
    channel_info = payload['channel']
    channel_info['channel_type'] = slack_constants.ChannelTypes.PUBLIC.value
    channel_obj = entities.SlackChannel(datasource_id, channel_info)
    channel_obj_model = channel_obj.get_model()
    db_session.add(channel_obj_model)
    datasource_obj = get_datasource(datasource_id)
    if datasource_obj:
        tags = {"channel_email": channel_obj_model.email}
        activity_db().add_event(domain_id=datasource_obj.domain_id,
                                connector_type=constants.ConnectorTypes.SLACK.value,
                                event_type='CHANNEL_CREATED', actor=None,
                                tags={})


def process_member_joined_channel(db_session, datasource_id, payload):
    joined_user_id = payload['user'] if 'user' in payload else None
    channel_id = payload['channel']
    if joined_user_id:
        user_channel_info = get_user_and_channel_info_based_on_ids(db_session, datasource_id, joined_user_id,
                                                                   channel_id)
        user_info = user_channel_info['user']
        channel_info = user_channel_info['channel']
        payload['name'] = channel_info.email

        directory_member_obj = entities.SlackDirectoryMember(db_session, datasource_id, user_info, joined_user_id, None, payload)
        db_session.execute(DirectoryStructure.__table__.insert().prefix_with("IGNORE").
                           values(db_utils.get_model_values(DirectoryStructure, directory_member_obj.get_model())))

        datasource_obj = get_datasource(datasource_id)
        if datasource_obj:
            activity_db().add_event(domain_id=datasource_obj.domain_id,
                                    connector_type=constants.ConnectorTypes.SLACK.value,
                                    event_type='MEMBER_JOINED_CHANNEL', actor=None,
                                    tags={"channel_id": channel_id, "channel_email": channel_info.email,
                                          "user_email": user_info.email})


def process_member_left_channel(db_session, datasource_id, payload):
    left_user_id = payload['user']
    channel_id = payload['channel']
    user_channel_info = get_user_and_channel_info_based_on_ids(db_session, datasource_id, left_user_id, channel_id)
    user_info = user_channel_info['user']
    channel_info = user_channel_info['channel']

    db_session.query(DirectoryStructure).filter(and_(DirectoryStructure.datasource_id == datasource_id,
                                                     DirectoryStructure.parent_email == channel_info.email,
                                                     DirectoryStructure.member_email == user_info.email)).delete()

    datasource_obj = get_datasource(datasource_id)
    if datasource_obj:
        activity_db().add_event(domain_id=datasource_obj.domain_id,
                                connector_type=constants.ConnectorTypes.SLACK.value,
                                event_type='MEMBER_LEFT_CHANNEL', actor=None,
                                tags={"channel_id": channel_id, "user_email": user_info.email, "channel_email": channel_info.email})


def get_user_and_channel_info_based_on_ids(db_session, datasource_id, user_id, channel_id):
    user_info = db_session.query(DomainUser).filter(and_(DomainUser.datasource_id == datasource_id,
                                                         DomainUser.user_id == user_id)).first()

    channel_info = db_session.query(DomainUser).filter(and_(DomainUser.datasource_id == datasource_id,
                                                            DomainUser.user_id == channel_id)).first()

    return {'user': user_info, 'channel': channel_info}
