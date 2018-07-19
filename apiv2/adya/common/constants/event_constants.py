
GSUITE_EVENT_TYPES = {
    "FILE_SHARE_PUBLIC": {"display_name": "File shared publicly", "desc": "A file is discoverable by anyone on internet", "event_template": "", "tags": [{"key": "domain_id", "desc": "Customer's domain", "default": ""}, {"key": "connector_type", "desc": "SaaS application name", "default": "GSUITE"}, {"key": "actor", "desc": "Entity triggering this event", "default": ""}], "enabled": True},
    "FILE_SHARE_ANYONEWITHLINK": {"display_name": "File shared with anyone with link", "desc": "A file is anyone with a link", "event_template": ""},
    "FILE_SHARE_EXTERNAL": {"display_name": "File shared externally", "desc": "A file is shared outside of organisation", "event_template": ""},
    "OAUTH_GRANT": {"display_name": "Third party app added", "desc": "A new third party app is granted access", "event_template": ""},
    "OAUTH_REVOKE": {"display_name": "Third party app removed", "desc": "Third party app access is removed", "event_template": ""},
    "SUSPICIOUS_LOGIN": {"display_name": "Suspicious login", "desc": "A suspicious login event is encountered", "event_template": ""},
    "USER_ADDED": {"display_name": "New user added", "desc": "A new user is added", "event_template": ""},
    "USER_REMOVED": {"display_name": "User removed", "desc": "A user is removed", "event_template": ""},
    "USER_SUSPENDED": {"display_name": "User suspended", "desc": "A user is suspended", "event_template": ""},
    "GROUP_MEMBERSHIP_CHANGED": {"display_name": "Group members changed", "desc": "Members in group has changed", "event_template": ""},
    "ROLE_CHANGED": {"display_name": "User role changed", "desc": "Role for user is changed", "event_template": ""}
} 

SLACK_EVENT_TYPES = {
    "FILE_SHARE_ANYONEWITHLINK": {"display_name": "Public link created", "desc": "A public link for file is created", "event_template": ""},
    "OAUTH_GRANT": {"display_name": "Third party app added", "desc": "A new third party app is granted access", "event_template": ""},
    "OAUTH_REVOKE": {"display_name": "Third party app removed", "desc": "Third party app access is removed", "event_template": ""},
    "USER_ADDED": {"display_name": "New user added", "desc": "A new user is added", "event_template": ""},
    "USER_SUSPENDED": {"display_name": "User suspended", "desc": "A user is suspended", "event_template": ""},
    "CHANNEL_MEMBERSHIP_CHANGED": {"display_name": "Group members changed", "desc": "Members in group has changed", "event_template": ""},
    "ROLE_CHANGED": {"display_name": "User role changed", "desc": "Role for user is changed", "event_template": ""}
} 

GITHUB_EVENT_TYPES = {
    "REP_ADDED": {"display_name": "New repository created", "desc": "A new repository is created", "event_template": ""},
    "REP_ARCHIVED": {"display_name": "Repository archived", "desc": "A repository is archived", "event_template": ""},
    "REP_PUBLIC": {"display_name": "Repository made public", "desc": "A repository is made public", "event_template": ""},
    "REP_VULNERABLE": {"display_name": "Repository vulnerable", "desc": "A security alert is generated on repository", "event_template": ""},
    "BRANCH_ADDED": {"display_name": "New branch created", "desc": "A new branch is created", "event_template": ""},
    "BRANCH_DELETED": {"display_name": "Branch deleted", "desc": "A branch is deleted", "event_template": ""},
    "REP_DEPLOYED": {"display_name": "Code deployed", "desc": "Code deployed", "event_template": ""},
    "REP_FORKED": {"display_name": "Repository forked", "desc": "A repository is forked", "event_template": ""},
    "APP_INSTALLED": {"display_name": "New app installed", "desc": "A new github app is installed", "event_template": ""},
    "ISSUE_OPENED": {"display_name": "New issue opened", "desc": "A new issue is opened", "event_template": ""},
    "LICENSE_CHANGED": {"display_name": "License change", "desc": "Github marketplace plan is changed", "event_template": ""},
    "COLLAB_ADDED": {"display_name": "Collaborator added", "desc": "A new repository collaborator is added", "event_template": ""},
    "COLLAB_REMOVED": {"display_name": "Collaborator removed", "desc": "A repository collaborator is removed", "event_template": ""},
    "COLLAB_PERM_CHANGED": {"display_name": "Collaborator permission changed", "desc": "A repository collaborator permission is changed", "event_template": ""},
    "TEAM_ADDED": {"display_name": "New team added", "desc": "A new team is added", "event_template": ""},
    "TEAM_REMOVED": {"display_name": "Team removed", "desc": "Team is removed", "event_template": ""},
    "TEAM_MEMBER_ADDED": {"display_name": "Team member added", "desc": "A new team member is added", "event_template": ""},
    "TEAM_MEMBER_REMOVED": {"display_name": "Team member removed", "desc": "A team member is removed", "event_template": ""},
    "ORG_MEMBER_ADDED": {"display_name": "Org member added", "desc": "A org member is added", "event_template": ""},
    "ORG_MEMBER_REMOVED": {"display_name": "Org member removed", "desc": "A org member is removed", "event_template": ""},
    "USER_BLOCKED": {"display_name": "User blocked", "desc": "A user is blocked from organisation", "event_template": ""},
    "USER_UNBLOCKED": {"display_name": "User unblocked", "desc": "A user is unblocked from organisation", "event_template": ""},
    "REP_PUSH": {"display_name": "Code pushed", "desc": "Code is pushed to repository", "event_template": ""},
} 