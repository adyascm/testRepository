
LOGIN_SCOPE = [
    'profile '
    'email '
    'https://www.googleapis.com/auth/admin.directory.user.readonly '
]

DRIVE_SCAN_SCOPE = LOGIN_SCOPE + [
    'https://www.googleapis.com/auth/admin.directory.user.readonly '
    'https://www.googleapis.com/auth/admin.directory.group.readonly '
    'https://www.googleapis.com/auth/admin.directory.group.member.readonly '
    'https://www.googleapis.com/auth/admin.directory.domain.readonly '
    'https://www.googleapis.com/auth/admin.reports.audit.readonly '
    'https://www.googleapis.com/auth/admin.directory.user.security '
]

DRIVE_ACTION_SCOPE = DRIVE_SCAN_SCOPE + [
    'https://www.googleapis.com/auth/admin.directory.group.member '
    'https://www.googleapis.com/auth/admin.directory.group '
    'https://www.googleapis.com/auth/admin.directory.user '
    'https://www.googleapis.com/auth/drive '
    'https://www.googleapis.com/auth/admin.datatransfer.readonly '
    'https://www.googleapis.com/auth/admin.datatransfer '
]

SERVICE_ACCOUNT_SCOPE = DRIVE_SCAN_SCOPE

SCOPE_DICT = {
    "login_scope": LOGIN_SCOPE,
    "drive_scan_scope": DRIVE_SCAN_SCOPE,
    "drive_action_scope": DRIVE_ACTION_SCOPE
}
