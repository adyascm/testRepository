import json
from datetime import datetime

from sqlalchemy import and_

from adya.common.db.models import DomainUser, DomainGroup, Resource, ResourcePermission, DataSource, alchemy_encoder

from adya.common.db.connection import db_connection

from adya.common.utils import messaging

from adya.common.constants import urls, constants
from adya.common.utils.response_messages import Logger
from adya.gsuite.gutils import check_if_external_user
from adya.slack import slack_utils


def start_slack_scan(auth_token, datasource_id, domain_id):
    Logger().info(
        "Received the request to start a slack scan for domain_id: {} datasource_id:{} ".format(
            domain_id, datasource_id))
    query_params = {"dataSourceId": datasource_id, "domainId": domain_id}

    messaging.trigger_get_event(urls.SCAN_SLACK_USERS, auth_token, query_params, "slack")
    messaging.trigger_get_event(urls.SCAN_SLACK_CHANNELS, auth_token, query_params, "slack")


def get_slack_users(auth_token, domain_id, datasource_id, next_cursor_token=None):
    try:
        slack_client = slack_utils.get_slack_client(datasource_id)
        user_list = slack_client.api_call(
            "users.list",
            limit=150,
            cursor=next_cursor_token
        )


        Logger().info("list of users :  - {}".format(user_list))
        member_list = user_list['members']
        total_memeber_count = len(member_list)
        query_params = {'dataSourceId': datasource_id, "domainId": domain_id}
        get_and_update_scan_count(datasource_id, DataSource.total_user_count, total_memeber_count, auth_token, True)
        # adding user to db
        # TODO: RECONCILIATION
        sentmemeber_count = 0
        while sentmemeber_count < total_memeber_count:
            memebersdata = {}
            memebersdata["users"] = member_list[sentmemeber_count:sentmemeber_count + 30]
            messaging.trigger_post_event(urls.SCAN_SLACK_USERS, auth_token, query_params, memebersdata, "slack")
            sentmemeber_count += 30

        next_cursor_token = user_list['response_metadata']['next_cursor']
        # making new call
        if next_cursor_token:
            query_params["nextCursor"] = next_cursor_token
            get_and_update_scan_count(datasource_id, DataSource.total_user_count, total_memeber_count, auth_token, True)
            messaging.trigger_get_event(urls.SCAN_SLACK_USERS, auth_token, query_params, "slack")
        else:
            get_and_update_scan_count(datasource_id, DataSource.user_scan_status, 1, auth_token, True)
            print "update the values"

    except Exception as ex:
        Logger().exception(
            "Exception occurred while getting data for slack users using next_cursor_token: {}".
                format(next_cursor_token))


def process_slack_users(datasource_id, domain_id, memebersdata):
    try:
        db_session = db_connection().get_session()
        members_data = memebersdata["users"]
        user_list = []
        channels_count = 0
        for member in members_data:
            channels_count = channels_count+1
            user = {}
            if member['deleted'] or member['is_bot']:
                continue
            profile_info = member['profile']
            user['datasource_id'] = datasource_id
            if 'email' in profile_info:
                user['email'] = profile_info['email']
            else:
                continue
            user['first_name'] = profile_info['first_name'] if 'first_name' in profile_info else None
            user['last_name'] = profile_info['last_name'] if 'last_name' in profile_info else None
            user['full_name'] = profile_info['real_name'] if 'real_name' in profile_info else None
            user['user_id'] = member['id']
            user['is_admin'] = member['is_admin']
            user['creation_time'] = datetime.fromtimestamp(member['updated']).strftime("%Y-%m-%d %H:%M:%S")
            user['member_type'] = constants.UserMemberType.INTERNAL
            # check for user type
            if check_if_external_user(db_session, domain_id, profile_info['email']):
                user['member_type'] = constants.UserMemberType.EXTERNAL

            user_list.append(user)
        db_session.bulk_insert_mappings(DomainUser, user_list)
        db_connection().commit()
        get_and_update_scan_count(datasource_id, DataSource.processed_user_count, channels_count, None, True)
    except Exception as ex:
        # get_and_update_scan_count(datasource_id, DataSource.total_group_count, 0, None, True)
        Logger().exception("Exception occurred while processing data for slack users ex: {}".format(ex))


def get_slack_channels(auth_token, datasource_id, next_cursor_token=None):
    try:
        slack_client = slack_utils.get_slack_client(datasource_id)
        public_channels = slack_client.api_call("channels.list",
                                                limit=150,
                                                cursor=next_cursor_token
                                                )
        channel_list = public_channels['channels']
        if not next_cursor_token:
            # this api call is being made only for the first time
            private_channels = slack_client.api_call("groups.list")
            private_channel_list = private_channels['groups']
            channel_list.extend(private_channel_list)
            Logger().info("list of private channels :  - {}".format(private_channels))

        Logger().info("list of public channels :  - {}".format(public_channels))

        Logger().info("list of channels :  - {}".format(channel_list))

        query_params = {'dataSourceId': datasource_id}
        # adding channels to db
        # TODO: RECONCILIATION
        total_channel_count = len(channel_list)
        get_and_update_scan_count(datasource_id, DataSource.total_group_count, total_channel_count, auth_token, True)

        sentchannel_count = 0
        while sentchannel_count < total_channel_count:
            channelsdata = {}
            channelsdata["channels"] = channel_list[sentchannel_count:sentchannel_count + 30]
            messaging.trigger_post_event(urls.SCAN_SLACK_CHANNELS, auth_token, query_params, channelsdata, "slack")
            sentchannel_count += 30

        next_cursor_token_for_public_channel = public_channels['response_metadata']['next_cursor']
        if next_cursor_token_for_public_channel:
            query_params = {"dataSourceId": datasource_id, "nextCursor": next_cursor_token}
            get_and_update_scan_count(datasource_id, DataSource.total_group_count, total_channel_count, auth_token, True)
            messaging.trigger_get_event(urls.SCAN_SLACK_CHANNELS, auth_token, query_params, "slack")

        else:
            get_and_update_scan_count(datasource_id, DataSource.group_scan_status, 1, auth_token,
                                      True)

            print "update the values"

    except Exception as ex:
        # get_and_update_scan_count(datasource_id, DataSource.total_group_count, 0, auth_token, True)
        Logger().exception(
            "Exception occurred while getting data for slack channels using next_cursor_token: {}".
                format(next_cursor_token))


def process_slack_channels(datasource_id, channel_data):
    try:


        group_list = []
        channel_list = channel_data["channels"]
        channel_count = 0
        for channel in channel_list:
            channel_count = channel_count+1
            group = {}
            group['datasource_id'] = datasource_id
            # TODO: Field that should store whether channel is private for public
            group['group_id'] = channel['id']
            group['email'] = channel['id']
            group['name'] = channel['name']
            group['direct_members_count'] = channel['num_members'] if 'num_members' in channel_list else None
            group['include_all_user'] = channel['is_general'] if 'is_general' in channel_list else None
            group_list.append(group)

        db_session = db_connection().get_session()
        db_session.bulk_insert_mappings(DomainGroup, group_list)

        db_connection().commit()
        get_and_update_scan_count(datasource_id, DataSource.processed_group_count, channel_count, None, True)

    except Exception as ex:
        Logger().exception("Exception occurred while processing data for slack channels using ex : {}".format(ex))


def get_slack_files(auth_token, datasource_id, page_number_token=None):
    try:
        slack_client = slack_utils.get_slack_client(datasource_id)
        file_list = slack_client.api_call("files.list", page=page_number_token)

        files = file_list['files']
        page_number = file_list['paging']['page']
        total_number_of_page = file_list['paging']['pages']

        query_params = {'dataSourceId': datasource_id}
        # adding channels to db
        # TODO: RECONCILIATION
        messaging.trigger_post_event(urls.SCAN_SLACK_FILES, auth_token, query_params, files, "slack")

        if page_number < total_number_of_page:
            page_number = page_number + 1
            query_params = {"dataSourceId": datasource_id, "nextPageNumber": page_number}
            messaging.trigger_get_event(urls.SCAN_SLACK_FILES, auth_token, query_params, "slack")

        else:
            # TODO: update count or signal of ending of file scan

            print "update the values"

    except Exception as ex:
        Logger().exception("Exception occurred while processing data for slack files using ex : {}".format(ex))


def process_slack_files(datasource_id, file_list):
    try:
        resource = Resource()
        for file in file_list:
            resource.datasource_id = datasource_id
            resource.resource_id = file['F3CEP2KFZ']
            resource.resource_name = file['name']
            resource.resource_type = file['filetype']
            resource.resource_size = file['size']
            resource.resource_owner_id = file['user']
            resource.creation_time = datetime.fromtimestamp(file['timestamp']).strftime("%Y-%m-%d %H:%M:%S")
            resource.web_content_link = file['url_private_download']
            resource.web_view_link = file['url_private']
            resource.parent_id = file[
                'channels']  # giving channel id as parent  TODO: channels will be list ; group can also be possible

            shared_id_list = []
            # files shared in various ways
            shared_in_channel = file['channels']
            shared_in_private_group = file['groups']
            shared_in_direct_msgs = file['ims']
            shared_id_list.append(shared_in_channel)
            shared_id_list.append(shared_in_private_group)
            shared_id_list.append(shared_in_direct_msgs)

            # TODO : Permissions for all fields
            # permissions processing
            for shared_list in shared_id_list:
                for shared_id in shared_list:
                    resourcePermission = ResourcePermission()
                    resourcePermission.datasource_id = datasource_id
                    resourcePermission.resource_id = file['name']
                    resourcePermission.email = shared_id  # adding id

        db_session = db_connection().get_session()
        db_session.add(resource)
        db_connection().commit()

    except Exception as ex:
        Logger().exception("Exception occurred while processing data for slack files using ex : {}".format(ex))


def get_and_update_scan_count(datasource_id, column_name, column_value, auth_token=None, send_message=False):
    db_session = db_connection().get_session()
    rows_updated = 0
    try:
        rows_updated = db_session.query(DataSource).filter(DataSource.datasource_id == datasource_id). \
            update({column_name: column_name + column_value})
        db_connection().commit()
    except Exception as ex:
        Logger().exception("Exception occurred while updating the scan status for the datasource.")
        db_session.rollback()

    if rows_updated == 1:
        datasource = db_session.query(DataSource).filter(and_(DataSource.datasource_id == datasource_id, DataSource.is_async_delete == False)).first()
        if send_message:
            messaging.send_push_notification("adya-scan-update", json.dumps(datasource, cls=alchemy_encoder()))
        if get_scan_status(datasource) == 1:
            messaging.send_push_notification("adya-scan-update", json.dumps(datasource, cls=alchemy_encoder()))

def get_scan_status(datasource):
    # if datasource.file_scan_status > 10000 or datasource.user_scan_status > 1 or datasource.group_scan_status > 1:
    #     return 2 #Failed

    file_status = 1
    if (datasource.file_scan_status >= file_status and datasource.total_file_count == datasource.processed_file_count) and (datasource.user_scan_status == 1 and datasource.total_user_count == datasource.processed_user_count) and (datasource.group_scan_status == 1 and datasource.total_group_count == datasource.processed_group_count):
        return 1 #Complete
    return 0 #In Progress
