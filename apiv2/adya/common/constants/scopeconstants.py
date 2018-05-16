
LOGIN_SCOPE = [
    'profile '
    'email '
]

DRIVE_SCAN_SCOPE = LOGIN_SCOPE + [
    'https://www.googleapis.com/auth/admin.directory.user.readonly '
    'https://www.googleapis.com/auth/admin.directory.group.readonly '
    'https://www.googleapis.com/auth/admin.directory.group.member.readonly '
    'https://www.googleapis.com/auth/admin.directory.domain.readonly '
    'https://www.googleapis.com/auth/admin.reports.audit.readonly '
    'https://www.googleapis.com/auth/drive.metadata.readonly '
]

GSUITE_FULL_SCAN_SCOPE = DRIVE_SCAN_SCOPE + [
    'https://www.googleapis.com/auth/admin.directory.user.security '
]

DRIVE_ACTION_SCOPE = GSUITE_FULL_SCAN_SCOPE + [
    'https://www.googleapis.com/auth/admin.directory.group.member '
    'https://www.googleapis.com/auth/admin.directory.group '
    'https://www.googleapis.com/auth/admin.directory.user '
    'https://www.googleapis.com/auth/drive '
    'https://www.googleapis.com/auth/admin.datatransfer.readonly '
    'https://www.googleapis.com/auth/admin.datatransfer '
]

SERVICE_ACCOUNT_SCOPE = DRIVE_ACTION_SCOPE

SERVICE_ACCOUNT_READONLY_SCOPE = GSUITE_FULL_SCAN_SCOPE

SCOPE_DICT = {
    "login_scope": LOGIN_SCOPE,
    "drive_scan_scope": DRIVE_SCAN_SCOPE,
    "drive_action_scope": DRIVE_ACTION_SCOPE
}

SCOPE_CSV = 'profile,email,https://www.googleapis.com/auth/admin.directory.user.readonly,https://www.googleapis.com/auth/admin.directory.group.readonly,https://www.googleapis.com/auth/admin.directory.group.member.readonly,https://www.googleapis.com/auth/admin.directory.domain.readonly,https://www.googleapis.com/auth/admin.reports.audit.readonly,https://www.googleapis.com/auth/admin.directory.user.security,https://www.googleapis.com/auth/drive.metadata.readonly,https://www.googleapis.com/auth/admin.directory.group.member,https://www.googleapis.com/auth/admin.directory.group,https://www.googleapis.com/auth/admin.directory.user,https://www.googleapis.com/auth/drive,https://www.googleapis.com/auth/admin.datatransfer.readonly,https://www.googleapis.com/auth/admin.datatransfer'

SLACK_READ_SCOPE = 'users.profile:read users:read admin channels:read groups:read users:read.email'

SLACK_SCOPE_DICT = {
    "slack_read_scopes" : SLACK_READ_SCOPE
}