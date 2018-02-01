import os
from enum import Enum

API_HOST = os.environ.get('API_HOST', 'http://localhost:5000')
UI_HOST = os.environ.get('UI_HOST', 'http://localhost:3000')

DB_URL = os.environ.get('DB_URL', 'localhost:3306')
DB_USERNAME = os.environ.get('DB_USERNAME', 'root')
DB_PWD = os.environ.get('DB_PWD', 'root')
DB_NAME = os.environ.get('DB_NAME', 'dev')

GOOGLE_OAUTH_CALLBACK_URL = API_HOST + "/googleoauthcallback"
OAUTH_STATUS_URL = UI_HOST + "/oauthstatus"

NEXT_CALL_FROM_FILE_ID = 4*60

GDRIVE_SCAN_URL = API_HOST + "/gdrivescan"
INITIAL_GDRIVE_SCAN = API_HOST + "/initialgdrivescan"

GET_PERMISSION_URL = API_HOST + "/permisssions"
PROCESS_RESOURCES_URL = API_HOST + "/processresources"

GET_DOMAIN_USER = API_HOST + "/getdomainusers"
PROCESS_USERS_DATA = API_HOST + "/processusers"

GET_GROUP = API_HOST + "/getdomaingroups"
PROCESS_GROUP_DATA = API_HOST + "/processgroups"

PROFILE_VIEW_SCOPE = ['profile '
                       'email ' ]

READ_DRIVE_SCOPE = ['https://www.googleapis.com/auth/drive.readonly ']

FULL_SCOPE = ['https://www.googleapis.com/auth/drive '
          'https://www.googleapis.com/auth/admin.directory.user '
          'https://www.googleapis.com/auth/admin.directory.group '
          'https://www.googleapis.com/auth/admin.reports.audit.readonly '
          'https://www.googleapis.com/auth/drive ']

SCOPE_DICT = {
    "profile_view": PROFILE_VIEW_SCOPE,
    "read_drive": READ_DRIVE_SCOPE,
    "full_scope": FULL_SCOPE
}


class ResourceExposureType(Enum):
    PRIVATE = "PVT"
    INTERNAL = "INT"
    DOMAIN = "DOMAIN"
    EXTERNAL = "EXT"
    PUBLIC = "PUBLIC"


class PermissionType(Enum):
      READ ="R"
      WRITE ="W"


class UserMemberType(Enum):
    INTERNAL = "INT"
    EXTERNAL = "EXT"
