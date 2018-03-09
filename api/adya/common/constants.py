import os
from enum import Enum

SERVERLESS_SERVICE_NAME = 'adya'
DEPLOYMENT_ENV = os.environ.get('DEPLOYMENT_ENV', 'local')

API_HOST = os.environ.get('API_HOST', 'http://localhost:5000')
UI_HOST = os.environ.get('UI_HOST', 'http://localhost:3000')

ROOT = "__root__"
ROOT_NAME ="dummy"
ROOT_MIME_TYPE = 'folder'

DB_URL = os.environ.get('DB_URL', 'localhost:3306')
DB_USERNAME = os.environ.get('DB_USERNAME', 'root')
DB_PWD = os.environ.get('DB_PWD', 'root')
DB_NAME = os.environ.get('DB_NAME', 'dev')

GOOGLE_OAUTHCALLBACK_PATH = "/googleoauthcallback"
GOOGLE_OAUTH_LOGIN = '/googleoauthlogin'
GOOGLE_OAUTH_CALLBACK_URL = API_HOST + GOOGLE_OAUTHCALLBACK_PATH
OAUTH_STATUS_PATH = "/oauthstatus"
OAUTH_STATUS_URL = UI_HOST + OAUTH_STATUS_PATH

NEXT_CALL_FROM_FILE_ID = 4 * 60

SCAN_START = "/scan/start"
SCAN_RESOURCES = "/scan/resources"

SCAN_PERMISSIONS = "/scan/permisssions"

SCAN_PARENTS = "/scan/parents"

SCAN_DOMAIN_USERS = "/scan/domainusers"

SCAN_DOMAIN_GROUPS = "/scan/domaingroups"

SCAN_GROUP_MEMBERS = "/scan/groupmembers"

SCAN_USERS_APP = '/scan/usersapp'

GET_USER_GROUP_TREE_PATH = "/getusergrouptree"

GET_APPS = "/getappsdata"

GET_RESOURCE_TREE_PATH = "/getresourcetree"

GET_DATASOURCE_PATH = '/datasources'

ASYNC_DELETE_DATASOURCE_PATH = '/asyncdatasourcedelete'

GET_SCHEDULED_RESOURCE_PATH = '/scheduledreport'

GET_ACTIVITIES_FOR_USER_PATH = '/getactivitiesforuser'

SUBSCRIBE_GDRIVE_NOTIFICATIONS_PATH = '/scan/subscribenotifications'
PROCESS_GDRIVE_NOTIFICATIONS_PATH = '/scan/processnotifications'
HANDLE_GDRIVE_CHANNEL_EXPIRATION_PATH = '/scan/handlechannelexpiration'

RUN_SCHEDULED_REPORT = '/scheduledreport/runreport'

GET_ALL_ACTIONS_PATH = '/getallactions'
INITIATE_ACTION_PATH = '/initiateaction'

GET_AUDITLOG_PATH = '/getauditlog'



def get_url_from_path(path):
    return API_HOST + path

SUCCESS_STATUS_CODE = 200

REAL_TIME_URL = 'http://ortc-developers2-euwest1-s0001.realtime.co/send'

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


class EmailType(Enum):
    USER = 'user'
    GROUP = 'group'
    DOMAIN = 'domain'
    ANYONE = 'anyone'


class Role(Enum):
    ORGANIZER = 'organizer'
    OWNER = 'owner'
    WRITER = 'writer'
    COMMENTER = 'commenter'
    READER = 'reader'

class ActionType(Enum):
    ADD = 'add'
    CHANGE = 'change'
    DELETE = 'delete'

PAGE_LIMIT = 100


class PolicyConditionMatch(Enum):
    CONTAIN = 'contain'
    EQUAL = 'equal'
    NOTEQUAL = 'notequal'