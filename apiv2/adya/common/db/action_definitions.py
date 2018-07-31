from adya.common.constants import action_constants

actions = [
    {"datasource_type": "GSUITE", "action_type": "QUICK_ACTION", "action_entity": "INTERNAL_USER", "key": action_constants.ActionNames.TRANSFER_OWNERSHIP.value, "name": "Transfer Ownership",
        "description": "Transfer ownership of all documents owned by \"{{full_name}}\"", "parameters": [{"key": "full_name", "label": "From user", "editable": 0},{"key": "old_owner_email", "label": "From user email", "editable": 0}, {"key": "new_owner_email", "label": "To user email", "editable": 1}], "is_admin_only": True},
    {"datasource_type": "GSUITE", "action_type": "QUICK_ACTION", "action_entity": "DOCUMENT", "key": action_constants.ActionNames.CHANGE_OWNER_OF_FILE.value, "name": "Transfer Ownership", "description": "Transfer ownership of \"{{resource_name}}\"", "parameters": [
        {"key": "resource_id", "label": "Id", "editable": 0, "hidden": 1}, {"key": "resource_name", "label": "Name", "editable": 0}, {"key": "old_owner_email", "label": "From User", "editable": 0}, {"key": "new_owner_email", "label": "To User", "editable": 1}], "is_admin_only": False},
    {"datasource_type": "GSUITE", "action_type": "QUICK_ACTION", "action_entity": "INTERNAL_USER", "key": action_constants.ActionNames.REMOVE_EXTERNAL_ACCESS.value, "name": "Remove external sharing",
        "description": "Remove access from outside the company for all documents owned by \"{{full_name}}\"", "parameters": [{"key": "full_name", "label": "For user", "editable": 0},{"key": "user_email", "label": "Email", "editable": 0}], "is_admin_only": False},
    {"datasource_type": "GSUITE", "action_type": "QUICK_ACTION", "action_entity": "DOCUMENT", "key": action_constants.ActionNames.REMOVE_EXTERNAL_ACCESS_TO_RESOURCE.value, "name": "Remove external sharing",
        "description": "Remove access from outside the company for \"{{resource_name}}\"", "parameters": [{"key": "resource_id", "label": "Id", "editable": 0, "hidden": 1}, {"key": "resource_name", "label": "Name", "editable": 0}], "is_admin_only": False},
    {"datasource_type": "GITHUB", "action_type": "QUICK_ACTION", "action_entity": "DOCUMENT", "key": action_constants.ActionNames.REMOVE_EXTERNAL_ACCESS_TO_RESOURCE.value, "name": "Remove external access",
        "description": "Remove access from outside the company for \"{{resource_name}}\"", "parameters": [{"key": "resource_id", "label": "Id", "editable": 0, "hidden": 1}, {"key": "resource_name", "label": "Name", "editable": 0}], "is_admin_only": False},
    {"datasource_type": "GSUITE", "action_type": "QUICK_ACTION", "action_entity": "INTERNAL_USER", "key": action_constants.ActionNames.MAKE_ALL_FILES_PRIVATE.value, "name": "Remove all sharing",
        "description": "Remove access to everyone for all documents owned by \"{{full_name}}\"", "parameters": [{"key": "full_name", "label": "For user", "editable": 0},{"key": "user_email", "label": "Email", "editable": 0}], "is_admin_only": False},
    {"datasource_type": "GSUITE", "action_type": "QUICK_ACTION", "action_entity": "DOCUMENT", "key": action_constants.ActionNames.MAKE_RESOURCE_PRIVATE.value, "name": "Remove all sharing",
        "description": "Remove access to everyone (except owner) for \"{{resource_name}}\"", "parameters": [{"key": "resource_id", "label": "Id", "editable": 0, "hidden": 1}, {"key": "resource_name", "label": "Name", "editable": 0}], "is_admin_only": False},
    {"datasource_type": "GSUITE", "action_type": "INLINE", "action_entity": "DOCUMENT", "key": action_constants.ActionNames.DELETE_PERMISSION_FOR_USER.value, "name": "Remove sharing", "description": "Remove sharing of selected document with user", "parameters": [
        {"key": "resource_id", "label": "Id", "editable": 0, "hidden": 1}, {"key": "resource_name", "label": "Name", "editable": 0}, {"key": "resource_owner_id", "label": "Owner", "editable": 0}, {"key": "user_email", "label": "For User", "editable": 0}], "is_admin_only": False},
    {"datasource_type": "GITHUB", "action_type": "INLINE", "action_entity": "DOCUMENT", "key": action_constants.ActionNames.DELETE_PERMISSION_FOR_USER.value, "name": "Remove sharing", "description": "Remove user as a collaborator to this repository", "parameters": [
        {"key": "resource_id", "label": "Id", "editable": 0, "hidden": 1}, {"key": "resource_name", "label": "Name", "editable": 0}, {"key": "resource_owner_id", "label": "Owner", "editable": 0}, {"key": "user_email", "label": "For User", "editable": 0}], "is_admin_only": False},
    {"datasource_type": "GSUITE", "action_type": "INLINE", "action_entity": "DOCUMENT", "key": action_constants.ActionNames.UPDATE_PERMISSION_FOR_USER.value, "name": "Change permission", "description": "Change permission for selected document with user", "parameters": [{"key": "resource_id", "label": "Id", "editable": 0, "hidden": 1}, {
        "key": "resource_name", "label": "Id", "editable": 0}, {"key": "resource_owner_id", "label": "Owner", "editable": 0}, {"key": "user_email", "label": "For User", "editable": 0}, {"key": "new_permission_role", "label": "New permission", "editable": 1}], "is_admin_only": False},
    {"datasource_type": "GSUITE", "action_type": "QUICK_ACTION", "action_entity": "INTERNAL_USER", "key": action_constants.ActionNames.WATCH_ALL_ACTION_FOR_USER.value, "name": "Watch activity",
        "description": "Get weekly report of all activities for \"{{full_name}}\"", "parameters": [{"key": "full_name", "label": "For user", "editable": 0},{"key": "user_email", "label": "Email", "editable": 0}], "is_admin_only": False},
    {"datasource_type": "GSUITE", "action_type": "QUICK_ACTION", "action_entity": "INTERNAL_USER", "key": action_constants.ActionNames.NOTIFY_USER_FOR_CLEANUP.value, "name": "Notify user",
        "description": "Send mail to \"{{full_name}}\" to audit documents", "parameters": [{"key": "full_name", "label": "For user", "editable": 0},{"key": "user_email", "label": "Email", "editable": 0}], "is_admin_only": True},
    {"datasource_type": "GSUITE", "action_type": "QUICK_ACTION", "action_entity": "USER", "key": action_constants.ActionNames.REMOVE_ALL_ACCESS_FOR_USER.value, "name": "Remove access",
        "description": "Remove access to \"{{full_name}}\" for any documents owned by others", "parameters": [{"key": "full_name", "label": "For user", "editable": 0},{"key": "user_email", "label": "Email", "editable": 0}], "is_admin_only": False},
    {"datasource_type": "GITHUB", "action_type": "QUICK_ACTION", "action_entity": "USER", "key": action_constants.ActionNames.REMOVE_ALL_ACCESS_FOR_USER.value, "name": "Remove access",
        "description": "Remove access to \"{{full_name}}\" from all repositories", "parameters": [{"key": "full_name", "label": "For user", "editable": 0},{"key": "user_email", "label": "Email", "editable": 0}], "is_admin_only": False},
    {"datasource_type": "GSUITE", "action_type": "INLINE", "action_entity": "INTERNAL_USER", "key": action_constants.ActionNames.REMOVE_USER_FROM_GROUP.value, "name": "Modify Group",
        "description": "Remove user from a group", "parameters": [{"key": "user_email", "label": "User Email", "editable": 0}, {"key": "group_email", "label": "From Group", "editable": 0}], "is_admin_only": False},
    {"datasource_type": "GSUITE", "action_type": "INLINE", "action_entity": "INTERNAL_USER", "key": action_constants.ActionNames.ADD_USER_TO_GROUP.value, "name": "Modify Group",
        "description": "Add user to a group", "parameters": [{"key": "user_email", "label": "User Email", "editable": 0}, {"key": "group_email", "label": "Group Email", "editable": 1}], "is_admin_only": False},
    {"datasource_type": "GSUITE", "action_type": "INLINE", "action_entity": "DOCUMENT", "key": action_constants.ActionNames.ADD_PERMISSION_FOR_A_FILE.value, "name": "Add sharing", "description": "Share the selected resource with user", "parameters": [{"key": "user_email", "label": "For user", "editable": 1}, {
        "key": "resource_id", "label": "Id", "editable": 0, "hidden": 1}, {"key": "resource_name", "label": "Name", "editable": 0}, {"key": "new_permission_role", "label": "New permission", "editable": 0}, {"key": "resource_owner_id", "label": "Owner", "editable": 0}], "is_admin_only": False},
    {"datasource_type": "GSUITE", "action_type": "INLINE", "action_entity": "APP", "key": action_constants.ActionNames.REMOVE_USER_FROM_APP.value, "name": "Uninstall app", "description": "Uninstall app for user",
        "parameters": [{"key": "app_id", "label": "AppId", "editable": 0, "hidden": 1}, {"key": "user_email", "label": "For user", "editable": 0}], "is_admin_only": True},
    {"datasource_type": "SLACK", "action_type": "QUICK_ACTION", "action_entity": "INTERNAL_USER", "key": action_constants.ActionNames.REMOVE_EXTERNAL_ACCESS.value, "name": "Remove external link",
        "description": "Remove external link for all documents owned by \"{{full_name}}\"", "parameters": [{"key": "full_name", "label": "For user", "editable": 0},{"key": "user_email", "label": "Email", "editable": 0}], "is_admin_only": False},
    {"datasource_type": "SLACK", "action_type": "QUICK_ACTION", "action_entity": "DOCUMENT", "key": action_constants.ActionNames.REMOVE_EXTERNAL_ACCESS_TO_RESOURCE.value, "name": "Remove external link",
        "description": "Remove external link for \"{{resource_name}}\"", "parameters": [{"key": "resource_id", "label": "Id", "editable": 0, "hidden": 1}, {"key": "resource_name", "label": "Name", "editable": 0}], "is_admin_only": False},
    {"datasource_type": "SLACK", "action_type": "INLINE", "action_entity": "INTERNAL_USER", "key": action_constants.ActionNames.REMOVE_USER_FROM_GROUP.value, "name": "Modify Channel",
        "description": "Remove user from a channel/group", "parameters": [{"key": "user_email", "label": "User Email", "editable": 0}, {"key": "group_email", "label": "From Channel/Group", "editable": 0}], "is_admin_only": False},
    {"datasource_type": "SLACK", "action_type": "INLINE", "action_entity": "INTERNAL_USER", "key": action_constants.ActionNames.ADD_USER_TO_GROUP.value, "name": "Change Channel",
        "description": "Add user to a channel/group", "parameters": [{"key": "user_email", "label": "User Email", "editable": 0}, {"key": "group_email", "label": "To Channel/Group", "editable": 1}], "is_admin_only": False},
    {"datasource_type": "ALL", "action_type": "INLINE", "action_entity": "APP", "key": action_constants.ActionNames.REMOVE_APP_FOR_DOMAIN.value, "name": "Uninstall App ",
        "description": "Uninstall application from domain", "parameters": [{"key": "app_id", "label": "AppId", "editable": 0, "hidden": 1}, {"key": "app_name", "label": "Application Name", "editable": 0}], "is_admin_only": True},
    {"datasource_type": "GSUITE", "action_type": "QUICK_ACTION", "action_entity": "USER", "key": action_constants.ActionNames.REMOVE_ALL_ACCESS_FOR_MULTIPLE_USERS.value, "name": "Remove access for users",
        "description": "Remove access to all selected users for any documents owned by others", "parameters": [{"key": "users_email", "label": "For users", "editable": 1}], "is_admin_only": False},
    {"datasource_type": "GSUITE", "action_type": "QUICK_ACTION", "action_entity": "INTERNAL_USER", "key": action_constants.ActionNames.NOTIFY_MULTIPLE_USERS_FOR_CLEANUP.value, "name": "Notify users for cleanup",
        "description": "Send mail to selected users to audit documents", "parameters": [{"key": "users_email", "label": "For users", "editable": 1}, {"key": "users_name", "label": "Users Name", "editable": 1}], "is_admin_only": True},        
]
