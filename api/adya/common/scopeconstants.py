
LOGIN_SCOPE = [
    'profile '
    'email '
    'https://www.googleapis.com/auth/admin.directory.user.readonly '
]

DRIVE_SCAN_SCOPE = [
    'profile '
    'email '
    'https://www.googleapis.com/auth/drive.readonly '
    'https://www.googleapis.com/auth/admin.directory.user.readonly '
    'https://www.googleapis.com/auth/admin.directory.group.readonly '
    'https://www.googleapis.com/auth/admin.reports.audit.readonly '
]

DRIVE_ACTION_SCOPE = [
    'profile '
    'email '
    'https://www.googleapis.com/auth/drive.readonly '
    'https://www.googleapis.com/auth/admin.directory.user.readonly '
    'https://www.googleapis.com/auth/admin.directory.group.readonly '
    'https://www.googleapis.com/auth/admin.reports.audit.readonly '
    'https://www.googleapis.com/auth/drive '
    'https://www.googleapis.com/auth/admin.datatransfer '
    'https://www.googleapis.com/auth/admin.datatransfer.readonly '

]

SERVICE_ACCOUNT_SCOPE = [
    'email '
    'https://www.googleapis.com/auth/drive.readonly '
    'https://www.googleapis.com/auth/drive '
    'https://www.googleapis.com/auth/admin.directory.user.readonly '
    'https://www.googleapis.com/auth/admin.directory.group.readonly '
    'https://www.googleapis.com/auth/admin.reports.audit.readonly '
    'https://www.googleapis.com/auth/admin.datatransfer '
    'https://www.googleapis.com/auth/admin.datatransfer.readonly '
    'profile '
]

SCOPE_DICT = {
    "login_scope": LOGIN_SCOPE,
    "drive_scan_scope": DRIVE_SCAN_SCOPE,
    "drive_action_scope": DRIVE_ACTION_SCOPE
}
