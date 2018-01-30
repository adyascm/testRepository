import os
from enum import Enum

API_HOST = os.environ.get('API_HOST', 'http://localhost:5000')
UI_HOST = os.environ.get('UI_HOST', 'http://localhost:3000')

DB_URL = os.environ.get('DB_URL', 'localhost:3306')
DB_USERNAME = os.environ.get('DB_USERNAME', 'root')
DB_PWD = os.environ.get('DB_PWD', 'root@adya')
DB_NAME = os.environ.get('DB_NAME', 'adya')

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
