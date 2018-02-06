
PROFILE_VIEW_SCOPE = ['profile '
                      'email ']

READ_DRIVE_SCOPE = ['profile '
                    'email '
                    'https://www.googleapis.com/auth/drive.readonly ']

FULL_SCOPE_READONLY = [
                            'profile '
                            'email '
                            'https://www.googleapis.com/auth/drive.readonly '
                            'https://www.googleapis.com/auth/admin.directory.user.readonly '
                            'https://www.googleapis.com/auth/admin.directory.group.readonly '
                            'https://www.googleapis.com/auth/admin.reports.audit.readonly '
                        ]

FULL_SCOPE = ['profile '
              'email '
              'https://www.googleapis.com/auth/drive '
              'https://www.googleapis.com/auth/admin.directory.user '
              'https://www.googleapis.com/auth/admin.directory.group '
              'https://www.googleapis.com/auth/admin.reports.audit.readonly '
              ]

SCOPE_DICT = {
    "profile_view": PROFILE_VIEW_SCOPE,
    "read_drive": READ_DRIVE_SCOPE,
    "read_only_fullscope" : FULL_SCOPE_READONLY,
    "full_scope": FULL_SCOPE
}
