from datetime import datetime

from adya.common.db.models import DomainUser, DomainGroup, Resource, ResourcePermission

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
        slack_client = slack_utils.get_slack_client(auth_token)
        user_list = slack_client.api_call(
            "users.list",
            limit=150,
            cursor=next_cursor_token
        )

        Logger().info("list of users :  - {}".format(user_list))
        member_list = user_list['members']
        total_memeber_count = len(member_list)
        query_params = {'dataSourceId': datasource_id}
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
            query_params = {"dataSourceId": datasource_id, "nextCursor": next_cursor_token, "domainId": domain_id}
            messaging.trigger_get_event(urls.SCAN_SLACK_USERS, auth_token, query_params, "slack")
        else:
            # TODO: update count or signal of ending of user scan
            print "update the values"

    except Exception as ex:
        Logger().exception(
            "Exception occurred while getting data for slack users using next_cursor_token: {}".
                format(next_cursor_token))


def process_slack_users(datasource_id, domain_id, memebersdata):
    try:
        db_session = db_connection().get_session()
        user = DomainUser()
        members_data = memebersdata["users"]
        for member in members_data:
            if member['deleted']:
                continue
            profile_info = member['profile']
            user.datasource_id = datasource_id
            user.email = profile_info['email']
            user.first_name = profile_info['first_name']
            user.last_name = profile_info['last_name']
            user.full_name = profile_info['real_name']
            user.user_id = member['id']
            user.is_admin = member['is_admin']
            user.creation_time = datetime.fromtimestamp(member['updated']).strftime("%Y-%m-%d %H:%M:%S")
            user.member_type = constants.UserMemberType.INTERNAL
            # check for user type
            if check_if_external_user(db_session, domain_id, profile_info['email']):
                user.member_type = constants.UserMemberType.EXTERNAL

        db_session.add(user)
        db_connection().commit()

    except Exception as ex:
        Logger().exception("Exception occurred while processing data for slack users ex: {}".format(ex))


def get_slack_channels(auth_token, datasource_id, next_cursor_token=None):
    try:
        slack_client = slack_utils.get_slack_client(auth_token)
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
        sentchannel_count = 0
        while sentchannel_count < total_channel_count:
            channelsdata = {}
            channelsdata["channels"] = channel_list[sentchannel_count:sentchannel_count + 30]
            messaging.trigger_post_event(urls.SCAN_SLACK_CHANNELS, auth_token, query_params, channel_list, "slack")
            sentchannel_count += 30

        next_cursor_token_for_public_channel = public_channels['response_metadata']['next_cursor']
        if next_cursor_token_for_public_channel:
            query_params = {"dataSourceId": datasource_id, "nextCursor": next_cursor_token}
            messaging.trigger_get_event(urls.SCAN_SLACK_CHANNELS, auth_token, query_params, "slack")

        else:
            # TODO: update count or signal of ending of channels scan

            print "update the values"

    except Exception as ex:
        Logger().exception(
            "Exception occurred while getting data for slack channels using next_cursor_token: {}".
                format(next_cursor_token))


def process_slack_channels(datasource_id, channel_data):
    try:
        groups = DomainGroup()
        channel_list = channel_data["channels"]
        for channel in channel_list:
            groups.datasource_id = datasource_id
            # TODO: Field that should store whether channel is private for public
            groups.email = channel['id']
            groups.name = channel['name']
            groups.direct_members_count = channel['num_members']
            groups.include_all_user = channel['is_general']

        db_session = db_connection().get_session()
        db_session.add(groups)
        db_connection().commit()

    except Exception as ex:
        Logger().exception("Exception occurred while processing data for slack channels using ex : {}".format(ex))


def get_slack_files(auth_token, datasource_id, page_number_token=None):
    try:
        slack_client = slack_utils.get_slack_client(auth_token)
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
