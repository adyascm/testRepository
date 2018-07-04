import json

from sqlalchemy import and_

from adya.common.constants import constants
from adya.common.db.action_utils import delete_resource_permission
from adya.common.db.connection import db_connection
from adya.common.db.models import DomainUser
from adya.common.utils.response_messages import Logger
from adya.slack import slack_utils, slack_constants

class Actions:
    def __init__(self, datasource_id, permissions, initiated_by_email):
        self.datasource_id = datasource_id
        self.permissions = permissions
        self.exception_messages = []
        self.updated_permissions = {}
        self.response = None
        self.initiated_by_email = initiated_by_email
        self.slack_client = slack_utils.get_slack_client(self.datasource_id)

    def get_exception_messages(self):
        return self.exception_messages

    def delete_public_and_external_sharing_for_file(self):
        for permission in self.permissions:
            if permission['exposure_type'] == constants.EntityExposureType.ANYONEWITHLINK.value:
                file_id = permission['resource_id']
                try:
                    removed_file = self.slack_client.api_call(
                        "files.revokePublicURL",
                        file=file_id
                    )
                    self.response = removed_file
                except Exception as ex:
                    Logger().exception("Exception ocuured while removing the permission - {}".format(ex))
                    self.exception_messages.append(ex.message)

                if not file_id in self.updated_permissions:
                    self.updated_permissions[file_id] = [permission]
                else:
                    self.updated_permissions[file_id].append(permission)
        try:
            delete_resource_permission(self.initiated_by_email, self.datasource_id, self.updated_permissions)
        except Exception as ex:
            Logger().exception("Exception occurred while removing permission from db")
            self.exception_messages.append("Exception occurred while removing permission from db")

        return self.response


# remove user from private/public channels
def delete_user_from_channel(datasource_id, channel_email, user_email):
    db_session = db_connection().get_session()
    existing_user = db_session.query(DomainUser).filter(and_(DomainUser.datasource_id == datasource_id,
                                                             DomainUser.email == user_email)).first()
    user_id = existing_user.user_id
    group = existing_user.groups
    channel_id = None
    channel_type = None
    for data in group:
        if data.email == channel_email:
            channel_id = data.user_id
            channel_type = json.loads(data.config)['channel_type']


    response = None
    slack_client = slack_utils.get_slack_client(datasource_id)
    if channel_type == slack_constants.ChannelTypes.PUBLIC.value:
        response = delete_user_from_public_channel(slack_client, channel_id, user_id)
    elif channel_type == slack_constants.ChannelTypes.PRIVATE.value:
        response = delete_user_from_private_channel(slack_client, channel_id, user_id)

    return response


def delete_user_from_public_channel(slack_client, channel_id, user_id):
    removed_user = slack_client.api_call(
        "channels.kick",
        channel=channel_id,
        user=user_id
    )
    return removed_user


def delete_user_from_private_channel(slack_client, channel_id, user_id):
    removed_user = slack_client.api_call(
        "groups.kick",
        channel=channel_id,
        user=user_id
    )
    return removed_user


# add user in private/public channel

def add_user_to_channel(datasource_id, channel_email, user_email):
    db_session = db_connection().get_session()

    email_list = [channel_email, user_email]
    existing_user_channel = db_session.query(DomainUser).filter(and_(DomainUser.datasource_id == datasource_id,
                                                             DomainUser.email.in_(email_list))).all()

    user_id = None
    channel_id = None
    channel_type = None

    for user in existing_user_channel:
        if user.email == channel_email:
            channel_id = user.user_id
            channel_type = (json.loads(user.config))['channel_type']
        elif user.email == user_email:
            user_id = user.user_id

    response = None
    slack_client = slack_utils.get_slack_client(datasource_id)
    if channel_type == slack_constants.ChannelTypes.PUBLIC.value:
        response = add_user_to_public_channel(slack_client, channel_id, user_id)
        response['member_id'] = user_id
    elif channel_type == slack_constants.ChannelTypes.PRIVATE.value:
        response = add_user_to_private_channel(slack_client, channel_id, user_id)
        response['member_id'] = user_id

    return response


def add_user_to_public_channel(slack_client, channel_id, user_id):
    added_user = slack_client.api_call(
        "channels.invite",
        channel=channel_id,
        user=user_id
    )
    return added_user


def add_user_to_private_channel(slack_client, channel_id, user_id):
    added_user = slack_client.api_call(
        "groups.invite",
        channel=channel_id,
        user=user_id
    )
    return added_user
