import os
from enum import Enum
import db_config

API_HOST = os.environ.get('API_HOST', 'http://localhost:5000')
UI_HOST = os.environ.get('UI_HOST', 'http://localhost:3000')

DB_URL = os.environ.get('DB_URL', 'localhost:3306')
DB_USERNAME = os.environ.get('DB_USERNAME', 'root')
DB_PWD = os.environ.get('DB_PWD', 'root@adya')
DB_NAME = os.environ.get('DB_NAME', 'adya')

GOOGLE_OAUTHCALLBACK_PATH = "/googleoauthcallback"
GOOGLE_OAUTH_LOGIN = '/googleoauthlogin'
GOOGLE_OAUTH_CALLBACK_URL = API_HOST + GOOGLE_OAUTHCALLBACK_PATH
OAUTH_STATUS_PATH = "/oauthstatus"
OAUTH_STATUS_URL = UI_HOST + OAUTH_STATUS_PATH

NEXT_CALL_FROM_FILE_ID = 4 * 60

GDRIVE_SCAN_PATH = "/scan/gdrivescan"
GDRIVE_SCAN_URL = API_HOST + GDRIVE_SCAN_PATH
INITIAL_GDRIVE_SCAN_PATH = "/scan/initialgdrivescan"
INITIAL_GDRIVE_SCAN = API_HOST + INITIAL_GDRIVE_SCAN_PATH

GET_PERMISSION_PATH = "/scan/permisssions"
GET_PERMISSION_URL = API_HOST + GET_PERMISSION_PATH
PROCESS_RESOURCES_PATH = "/scan/processresources"
PROCESS_RESOURCES_URL = API_HOST + PROCESS_RESOURCES_PATH

GET_DOMAIN_USER_PATH = "/scan/getdomainusers"
GET_DOMAIN_USER_URL = API_HOST + GET_DOMAIN_USER_PATH

PROCESS_USERS_PATH = "/scan/processusers"
PROCESS_USERS_DATA_URL = API_HOST + PROCESS_USERS_PATH

GET_DOMAIN_GROUP_PATH = "/scan/getdomaingroups"
GET_GROUP_URL = API_HOST + GET_DOMAIN_GROUP_PATH
PROCESS_GROUP_PATH = "/scan/processgroups"
PROCESS_GROUP_DATA_URL = API_HOST + PROCESS_GROUP_PATH
GET_GROUP_MEMBERS_PATH = "/scan/getgroupmembers"
GET_GROUP_MEMBERS_URL = API_HOST + GET_GROUP_MEMBERS_PATH
PROCESS_GROUP_MEMBER_PATH = "/scan/processgroupmembers"
PROCESS_GROUP_MEMBER_DATA_URL = API_HOST + PROCESS_GROUP_MEMBER_PATH

GET_USER_GROUP_TREE_PATH = "/getusergrouptree"
GET_USER_GROUP_TREE_URL = API_HOST + GET_USER_GROUP_TREE_PATH

GET_DATASOURCE_PATH = '/datasources'

def get_url_from_path(path):
    return API_HOST + path


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
