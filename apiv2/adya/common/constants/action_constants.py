from enum import Enum

from adya.common.constants import urls
from adya.common.constants.constants import ConnectorTypes


class ActionNames(Enum):
    TRANSFER_OWNERSHIP = "transfer_ownership"
    CHANGE_OWNER_OF_FILE = "change_owner"
    REMOVE_EXTERNAL_ACCESS = "remove_external_access"
    REMOVE_EXTERNAL_ACCESS_TO_RESOURCE = "remove_external_access_to_resource"
    MAKE_ALL_FILES_PRIVATE = "make_all_files_private"
    MAKE_RESOURCE_PRIVATE = "make_resource_private"
    DELETE_PERMISSION_FOR_USER = "delete_permission_for_user"
    UPDATE_PERMISSION_FOR_USER = "update_permission_for_user"
    WATCH_ALL_ACTION_FOR_USER = "watch_all_action_for_user"
    REMOVE_ALL_ACCESS_FOR_USER = "remove_all_access"
    REMOVE_USER_FROM_GROUP = "remove_user_from_group"
    ADD_USER_TO_GROUP = "add_user_to_group"
    ADD_PERMISSION_FOR_A_FILE = "add_permission_for_a_File"
    NOTIFY_USER_FOR_CLEANUP = "notify_user_for_clean_up"
    REMOVE_USER_FROM_APP = "remove_user_from_app"
    REMOVE_APP_FOR_DOMAIN = "remove_app_for_domain"
    DELETE_REPOSITORY = "delete_repository"
    REMOVE_MEMBER_FROM_ORGANIZATION = "remove_member_from_organization"
    REMOVE_ALL_ACCESS_FOR_MULTIPLE_USERS = "remove_all_access_for_multiple_users"
    NOTIFY_MULTIPLE_USERS_FOR_CLEANUP = "notify_multiple_users_for_clean_up"


class ActionStatus(Enum):
    STARTED = 'STARTED'
    SUCCESS = 'SUCCESS'
    FAILED = 'FAILED'

connector_servicename_map = {
    ConnectorTypes.GSUITE.value: 'gsuite',
    ConnectorTypes.SLACK.value: 'slack',
    ConnectorTypes.GITHUB.value: 'github'
}

datasource_execute_action_map = {
    ConnectorTypes.GSUITE.value: urls.EXECUTE_GSUITE_ACTION,
    ConnectorTypes.SLACK.value: urls.EXECUTE_SLACK_ACTION,
    ConnectorTypes.GITHUB.value: urls.EXECUTE_GITHUB_ACTION
}






