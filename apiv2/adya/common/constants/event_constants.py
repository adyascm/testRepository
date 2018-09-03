from adya.common.constants import constants
from adya.common.constants.constants import ConnectorTypes

GSUITE_EVENT_TYPES = {
    "FILE_SHARE_PUBLIC": {"datasource_type": "GSUITE", "display_name": "File shared publicly", "desc": "A file is discoverable by anyone on internet", "event_template": "File \"{{resource_name}}\"  is discoverable by anyone on internet", "tags": constants.COMMON_TAGS[:], "enabled": True},
    "FILE_SHARE_ANYONEWITHLINK": {"datasource_type": "GSUITE", "display_name": "File shared with anyone with link", "desc": "A file is anyone with a link", "event_template": "File \"{{resource_name}}\" is shared to anyone with a link"},
    "FILE_SHARE_EXTERNAL": {"datasource_type": "GSUITE", "display_name": "File shared externally", "desc": "A file is shared outside of organisation", "event_template": "File \"{{resource_name}}\" is shared outside of organisation"},
    "OAUTH_GRANT": {"datasource_type": "GSUITE", "display_name": "Third party app added", "desc": "A new third party app is granted access", "event_template": "A new third party app \"{{display_text}}\" is granted access", "tags": constants.COMMON_TAGS[:] + [{"key": "score", "default": ""},{"key": "display_text", "default": ""}]},
     "OAUTH_REVOKE": {"datasource_type": "GSUITE", "display_name": "Third party app removed", "desc": "Third party app access is removed", "event_template": "Third party app \"{{display_text}}\" access is removed", "tags": constants.COMMON_TAGS[:] + [{"key": "display_text", "default": ""}]},
    "SUSPICIOUS_LOGIN": {"datasource_type": "GSUITE", "display_name": "Suspicious login", "desc": "A suspicious login event is encountered", "event_template": "A suspicious login event is encountered"},
    "CREATE_USER": {"datasource_type": "GSUITE", "display_name": "New user added", "desc": "A new user is added", "event_template": "A new user is added", "tags": constants.COMMON_TAGS[:] + [{"key": "is_admin", "default": ""}]},
    "DELETE_USER": {"datasource_type": "GSUITE", "display_name": "User removed", "desc": "A user is removed", "event_template": "A user is removed", "tags": constants.COMMON_TAGS[:]},
    "SUSPEND_USER": {"datasource_type": "GSUITE", "display_name": "User suspended", "desc": "A user is suspended", "event_template": "A user is suspended", "tags": constants.COMMON_TAGS[:] + [{"key": "user_email", "default": ""}]},
    "GROUP_MEMBERSHIP_CHANGED": {"datasource_type": "GSUITE", "display_name": "Group members changed", "desc": "Members in group has changed", "event_template": "Members in group has changed"},
    "GRANT_ADMIN_PRIVILEGE": {"datasource_type": "GSUITE", "display_name": "User role changed", "desc": "Role for user is changed", "event_template": "Role for user is changed", "tags": constants.COMMON_TAGS[:]},
    "ADD_GROUP_MEMBER": {"datasource_type": "GSUITE", "display_name": "Member added to group", "desc": "Member is added to group", "event_template": "Member is added to group", "tags": constants.COMMON_TAGS[:] + [{"key": "group_email", "default": ""}]},
    "DOWNLOAD": {"datasource_type": "GSUITE", "display_name": "File downloaded", "desc": "File is downloaded", "event_template": "File \"{{resource_name}}\" is downloaded", "tags": constants.COMMON_TAGS[:]}
}

SLACK_EVENT_TYPES = {
    "FILE_SHARE_ANYONEWITHLINK": {"datasource_type": "SLACK", "display_name": "Public link created", "desc": "A public link for file is created", "event_template": "File \"{{resource_name}}\" is shared to anyone with a link"},
    "OAUTH_GRANT": {"datasource_type": "SLACK" , "display_name": "Third party app added", "desc": "A new third party app is granted access", "event_template": "A new third party app \"{{display_text}}\" is granted access", "tags":constants.COMMON_TAGS[:] + [{"key": "score", "desc": "App score", "default": ""}, {"key": "display_text", "desc": "App name", "default": ""}]},
    "OAUTH_REVOKE": {"datasource_type": "SLACK", "display_name": "Third party app removed", "desc": "Third party app access is removed", "event_template": "Third party app \"{{display_text}}\" access is removed", "tags":constants.COMMON_TAGS[:] + [{"key": "display_text", "desc": "App name", "default": ""}]},
    "USER_ADDED": {"datasource_type": "SLACK", "display_name": "New user added", "desc": "A new user is added", "event_template": "A new user is added", "tags":constants.COMMON_TAGS[:] + [{"key": "member_type", "desc": "User member type", "default": "EXT"}]},
    "SUSPEND_USER": {"datasource_type": "SLACK", "display_name": "User suspended", "desc": "A user is suspended", "event_template": "A user is suspended"},
    "CHANNEL_MEMBERSHIP_CHANGED": {"datasource_type": "SLACK", "display_name": "Group members changed", "desc": "Members in group has changed", "event_template": "Members in group has changed"},
    "ROLE_CHANGED": {"datasource_type": "SLACK", "display_name": "User role changed", "desc": "Role for user is changed", "event_template": "Role for user is changed", "tags":constants.COMMON_TAGS[:] + [{"key": "user_role", "desc": "User role as admin or not", "default": ""}]},
    "CHANNEL_ARCHIVE": {"datasource_type": "SLACK" , "display_name": "Channel archived", "desc": "Channel archived", "event_template": "Channel \"{{channel_name}}\" archived", "tags":constants.COMMON_TAGS[:]},
    "CHANNEL_UNARCHIVE": {"datasource_type": "SLACK", "display_name": "Channel unarchived", "desc": "Channel is unarchived", "event_template": "Channel \"{{channel_name}}\" is unarchived", "tags":constants.COMMON_TAGS[:]},
    "FILE_CHANGED": {"datasource_type": "SLACK" , "display_name": "File changed", "desc": "File is changed", "event_template": "File is changed", "tags":constants.COMMON_TAGS[:]},
    "MEMBER_LEFT_CHANNEL": {"datasource_type": "SLACK", "display_name": "Member left the channel", "desc": "Member left the channel", "event_template": "Member \"{{user_name}}\" left the channel \"{{channel_name}}\"", "tags":constants.COMMON_TAGS[:] + [{"key": "channel_id", "default": ""}]},
    "MEMBER_JOINED_CHANNEL": {"datasource_type": "SLACK", "display_name": "Member joined the channel", "desc": "Member joined the channel", "event_template": "Member \"{{user_name}}\" joined the channel \"{{channel_name}}\"", "tags": constants.COMMON_TAGS[:] + [{"key": "channel_id", "default": ""}]},
    "CHANNEL_CREATED": {"datasource_type": "SLACK", "display_name": "Channel created", "desc": "Channel created", "event_template": "Channel \"{{channel_name}}\" created", "tags": constants.COMMON_TAGS[:]}

}

GITHUB_EVENT_TYPES = {
    "REP_ADDED": {"datasource_type": "GITHUB", "display_name": "New repository created", "desc": "A new repository is created", "event_template": ""},
    "REP_ARCHIVED": {"datasource_type": "GITHUB", "display_name": "Repository archived", "desc": "A repository is archived", "event_template": ""},
    "REP_PUBLIC": {"datasource_type": "GITHUB", "display_name": "Repository made public", "desc": "A repository is made public", "event_template": ""},
    "REP_VULNERABLE": {"datasource_type": "GITHUB", "display_name": "Repository vulnerable", "desc": "A security alert is generated on repository", "event_template": ""},
    "BRANCH_ADDED": {"datasource_type": "GITHUB", "display_name": "New branch created", "desc": "A new branch is created", "event_template": ""},
    "BRANCH_DELETED": {"datasource_type": "GITHUB", "display_name": "Branch deleted", "desc": "A branch is deleted", "event_template": ""},
    "REP_DEPLOYED": {"datasource_type": "GITHUB", "display_name": "Code deployed", "desc": "Code deployed", "event_template": ""},
    "REP_FORKED": {"datasource_type": "GITHUB", "display_name": "Repository forked", "desc": "A repository is forked", "event_template": ""},
    "APP_INSTALLED": {"datasource_type": "GITHUB", "display_name": "New app installed", "desc": "A new github app is installed", "event_template": ""},
    "ISSUE_OPENED": {"datasource_type": "GITHUB", "display_name": "New issue opened", "desc": "A new issue is opened", "event_template": ""},
    "LICENSE_CHANGED": {"datasource_type": "GITHUB", "display_name": "License change", "desc": "Github marketplace plan is changed", "event_template": ""},
    "COLLAB_ADDED": {"datasource_type": "GITHUB", "display_name": "Collaborator added", "desc": "A new repository collaborator is added", "event_template": ""},
    "COLLAB_REMOVED": {"datasource_type": "GITHUB", "display_name": "Collaborator removed", "desc": "A repository collaborator is removed", "event_template": ""},
    "COLLAB_PERM_CHANGED": {"datasource_type": "GITHUB", "display_name": "Collaborator permission changed", "desc": "A repository collaborator permission is changed", "event_template": ""},
    "TEAM_ADDED": {"datasource_type": "GITHUB", "display_name": "New team added", "desc": "A new team is added", "event_template": ""},
    "TEAM_REMOVED": {"datasource_type": "GITHUB", "display_name": "Team removed", "desc": "Team is removed", "event_template": ""},
    "TEAM_MEMBER_ADDED": {"datasource_type": "GITHUB", "display_name": "Team member added", "desc": "A new team member is added", "event_template": ""},
    "TEAM_MEMBER_REMOVED": {"datasource_type": "GITHUB", "display_name": "Team member removed", "desc": "A team member is removed", "event_template": ""},
    "ORG_MEMBER_ADDED": {"datasource_type": "GITHUB", "display_name": "Org member added", "desc": "A org member is added", "event_template": ""},
    "ORG_MEMBER_REMOVED": {"datasource_type": "GITHUB", "display_name": "Org member removed", "desc": "A org member is removed", "event_template": ""},
    "USER_BLOCKED": {"datasource_type": "GITHUB", "display_name": "User blocked", "desc": "A user is blocked from organisation", "event_template": ""},
    "USER_UNBLOCKED": {"datasource_type": "GITHUB", "display_name": "User unblocked", "desc": "A user is unblocked from organisation", "event_template": ""},
    "REP_PUSH": {"datasource_type": "GITHUB", "display_name": "Code pushed", "desc": "Code is pushed to repository", "event_template": ""},
}

datasource_event_types_map = {
    ConnectorTypes.GSUITE.value: GSUITE_EVENT_TYPES,
    ConnectorTypes.SLACK.value: SLACK_EVENT_TYPES,
    ConnectorTypes.GITHUB.value: GITHUB_EVENT_TYPES
}
