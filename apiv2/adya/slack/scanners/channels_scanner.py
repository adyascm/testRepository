import json
from datetime import datetime

from sqlalchemy.orm.exc import StaleDataError
from sqlalchemy import and_, outerjoin

from adya.common.db import models
from adya.common.db.models import DomainUser, Resource, ResourcePermission, DataSource, alchemy_encoder, \
    Application, ApplicationUserAssociation, DirectoryStructure, DatasourceCredentials

from adya.common.db.connection import db_connection

from adya.common.utils import messaging

from adya.common.constants import urls, constants
from adya.common.utils.response_messages import Logger
from adya.slack import slack_utils, slack_constants
from adya.slack.mappers import entities
from adya.slack.slack_utils import is_external_user


def query(auth_token, query_params, scanner):
    next_page_token = query_params["nextPageNumber"]
    slack_client = slack_utils.get_slack_client(scanner.datasource_id)
    public_channels = slack_client.api_call(
        "channels.list",
        limit=150,
        cursor=next_page_token
    )
    channel_list = public_channels['channels']
    next_page_token = public_channels['response_metadata']['next_cursor']
    for channel in channel_list:
        channel['channel_type'] = slack_constants.ChannelTypes.PUBLIC.value

    # If Channel scan is finished, get the private groups
    if not next_page_token:
        private_channels = slack_client.api_call("groups.list")
        private_channel_list = private_channels['groups']
        for group in private_channel_list:
            group['channel_type'] = slack_constants.ChannelTypes.PRIVATE.value

        channel_list.extend(private_channel_list)
    return {"payload": channel_list, "nextPageNumber": next_page_token}


def process(db_session, auth_token, query_params, scanner_data):
    datasource_id = query_params["dataSourceId"]
    db_session = db_connection().get_session()
    try:

        channel_list = scanner_data["entities"]
        channel_count = 0
        for channel in channel_list:
            channel_count = channel_count + 1
            channel_obj = entities.SlackChannel(datasource_id, channel)
            db_session.add(channel_obj.get_model())
            db_connection().commit()

            directory_member_model = channel_obj.get_directory_members()
            db_session.bulk_save_objects(directory_member_model)

        db_connection().commit()
        return channel_count
    except Exception as ex:
        Logger().exception("Exception occurred while processing data for slack channels using ex : {}".format(ex))
        db_session.rollback()
        return 0


def post_process(db_session, auth_token, query_params):
    pass
