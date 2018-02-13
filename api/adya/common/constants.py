import os
from enum import Enum

API_HOST = os.environ.get('API_HOST', 'http://localhost:5000')
UI_HOST = os.environ.get('UI_HOST', 'http://localhost:3000')

ROOT = "__root__"
ROOT_NAME ="dummy"
ROOT_MIME_TYPE = 'folder'

DB_URL = os.environ.get('DB_URL', 'localhost:3306')
DB_USERNAME = os.environ.get('DB_USERNAME', 'root')
DB_PWD = os.environ.get('DB_PWD', 'root@adya')
DB_NAME = os.environ.get('DB_NAME', 'adya')

LAMBDA_FUNCTION_NAME_FOR_CRON = os.environ.get("LAMBDA_FUNCTION_NAME", "execute_cron_report")

GOOGLE_OAUTHCALLBACK_PATH = "/googleoauthcallback"
GOOGLE_OAUTH_LOGIN = '/googleoauthlogin'
GOOGLE_OAUTH_CALLBACK_URL = API_HOST + GOOGLE_OAUTHCALLBACK_PATH
OAUTH_STATUS_PATH = "/oauthstatus"
OAUTH_STATUS_URL = UI_HOST + OAUTH_STATUS_PATH

NEXT_CALL_FROM_FILE_ID = 4 * 60

SCAN_RESOURCES = "/scan/resources"

SCAN_PERMISSIONS = "/scan/permisssions"

SCAN_DOMAIN_USERS = "/scan/domainusers"

SCAN_DOMAIN_GROUPS = "/scan/domaingroups"

SCAN_GROUP_MEMBERS = "/scan/groupmembers"

GET_USER_GROUP_TREE_PATH = "/getusergrouptree"

GET_RESOURCE_TREE_PATH = "/getresourcetree"

GET_DATASOURCE_PATH = '/datasources'

GET_SCHEDULED_RESOURCE_PATH = '/scheduledreport'


class ResourceExposureType(Enum):
    PRIVATE = "PVT"
    INTERNAL = "INT"
    DOMAIN = "DOMAIN"
    EXTERNAL = "EXT"
    PUBLIC = "PUBLIC"


class PermissionType(Enum):
    READ = "R"
    WRITE = "W"


class UserMemberType(Enum):
    INTERNAL = "INT"
    EXTERNAL = "EXT"


class GroupMemberType(Enum):
    INTERNAL = "INT"
    EXTERNAL = "EXT"
