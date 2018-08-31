from adya.common.constants import constants

GSUITE_EVENT_TYPES = {
    "FILE_SHARE_PUBLIC": {"datasource_type": "GSUITE", "display_name": "File shared publicly", "desc": "A file is discoverable by anyone on internet", "event_template": "", "tags": constants.COMMON_TAGS, "enabled": True},
    "FILE_SHARE_ANYONEWITHLINK": {"datasource_type": "GSUITE", "display_name": "File shared with anyone with link", "desc": "A file is anyone with a link", "event_template": ""},
    "FILE_SHARE_EXTERNAL": {"datasource_type": "GSUITE", "display_name": "File shared externally", "desc": "A file is shared outside of organisation", "event_template": ""},
    "OAUTH_GRANT": {"datasource_type": "GSUITE", "display_name": "Third party app added", "desc": "A new third party app is granted access", "event_template": "", "tags": constants.COMMON_TAGS.extend([{"score": "", "display_text": ""}])},
     "OAUTH_REVOKE": {"datasource_type": "GSUITE", "display_name": "Third party app removed", "desc": "Third party app access is removed", "event_template": "", "tags": constants.COMMON_TAGS.extend([{"display_text": ""}])},
    "SUSPICIOUS_LOGIN": {"datasource_type": "GSUITE", "display_name": "Suspicious login", "desc": "A suspicious login event is encountered", "event_template": ""},
    "CREATE_USER": {"datasource_type": "GSUITE", "display_name": "New user added", "desc": "A new user is added", "event_template": "", "tags": constants.COMMON_TAGS.extend([{"is_admin": ''}])},
    "DELETE_USER": {"datasource_type": "GSUITE", "display_name": "User removed", "desc": "A user is removed", "event_template": "", "tags": constants.COMMON_TAGS},
    "SUSPEND_USER": {"datasource_type": "GSUITE", "display_name": "User suspended", "desc": "A user is suspended", "event_template": "", "tags": constants.COMMON_TAGS.extend({"user_email":''})},
    "GROUP_MEMBERSHIP_CHANGED": {"datasource_type": "GSUITE", "display_name": "Group members changed", "desc": "Members in group has changed", "event_template": ""},
    "GRANT_ADMIN_PRIVILEGE": {"datasource_type": "GSUITE", "display_name": "User role changed", "desc": "Role for user is changed", "event_template": "", "tags": constants.COMMON_TAGS},
    "ADD_GROUP_MEMBER": {"datasource_type": "GSUITE", "display_name": "Member added to group", "desc": "Member is added to group", "event_template": "", "tags": constants.COMMON_TAGS.extend([{"group_email": ""}])},
    "DOWNLOAD": {"datasource_type": "GSUITE", "display_name": "File downloaded", "desc": "File is downloaded", "event_template": "", "tags": constants.COMMON_TAGS}
}

SLACK_EVENT_TYPES = {
    "FILE_SHARE_ANYONEWITHLINK": {"datasource_type": "SLACK", "display_name": "Public link created", "desc": "A public link for file is created", "event_template": ""},
    "OAUTH_GRANT": {"datasource_type": "SLACK" , "display_name": "Third party app added", "desc": "A new third party app is granted access", "event_template": "", "tags":constants.COMMON_TAGS.extend([{"key": "score", "desc": "App score", "default": ""}, {"key": "display_text", "desc": "App name", "default": ""}])},
    "OAUTH_REVOKE": {"datasource_type": "SLACK", "display_name": "Third party app removed", "desc": "Third party app access is removed", "event_template": "", "tags":constants.COMMON_TAGS.extend([{"key": "display_text", "desc": "App name", "default": ""}])},
    "USER_ADDED": {"datasource_type": "SLACK", "display_name": "New user added", "desc": "A new user is added", "event_template": "", "tags":constants.COMMON_TAGS.extend([{"key": "member_type", "desc": "User member type", "default": "EXT"}])},
    "USER_SUSPENDED": {"datasource_type": "SLACK", "display_name": "User suspended", "desc": "A user is suspended", "event_template": ""},
    "CHANNEL_MEMBERSHIP_CHANGED": {"datasource_type": "SLACK", "display_name": "Group members changed", "desc": "Members in group has changed", "event_template": ""},
    "ROLE_CHANGED": {"datasource_type": "SLACK", "display_name": "User role changed", "desc": "Role for user is changed", "event_template": "", "tags":constants.COMMON_TAGS.extend([{"key": "user_role", "desc": "User role as admin or not", "default": ""}])},
    "CHANNEL_ARCHIVE": {"datasource_type": "SLACK" , "display_name": "Channel archieved", "desc": "Channel archieved", "event_template": "", "tags":constants.COMMON_TAGS},
    "CHANNEL_UNARCHIVE": {"datasource_type": "SLACK", "display_name": "Channel unarchieved", "desc": "Channel is unarchieved", "event_template": "", "tags":constants.COMMON_TAGS},
    "FILE_CHANGED": {"datasource_type": "SLACK" , "display_name": "File changed", "desc": "File is changed", "event_template": "", "tags":constants.COMMON_TAGS},
    "MEMBER_LEFT_CHANNEL": {"datasource_type": "SLACK", "display_name": "Member left the channel", "desc": "Member left the channel", "event_template": "", "tags":constants.COMMON_TAGS.extend([{"channel_id": ""}])},
    "MEMBER_JOINED_CHANNEL": {"datasource_type": "SLACK", "display_name": "Member joined the channel", "desc": "Member joined the channel", "event_template": "", "tags": constants.COMMON_TAGS.extend([{"channel_id": ""}])},
    "CHANNEL_CREATED": {"datasource_type": "SLACK", "display_name": "Channel created", "desc": "Channel created", "event_template": "", "tags": constants.COMMON_TAGS}

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
