import os
from enum import Enum

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

GOOGLE_OAUTHCALLBACK_PATH = "/google/oauthcallback"
GOOGLE_OAUTH_LOGIN = '/google/oauthlogin'
GOOGLE_OAUTH_CALLBACK_URL = API_HOST + GOOGLE_OAUTHCALLBACK_PATH
OAUTH_STATUS_PATH = "/oauthstatus"
OAUTH_STATUS_URL = UI_HOST + OAUTH_STATUS_PATH

NEXT_CALL_FROM_FILE_ID = 4 * 60

SCAN_START = "/google/scan/start"
SCAN_RESOURCES = "/google/scan/resources"
SCAN_PERMISSIONS = "/google/scan/permisssions"
SCAN_PARENTS = "/google/scan/parents"
SCAN_DOMAIN_USERS = "/google/scan/domainusers"
SCAN_DOMAIN_GROUPS = "/google/scan/domaingroups"
SCAN_GROUP_MEMBERS = "/google/scan/groupmembers"
SCAN_USERS_APP = '/google/scan/usersapp'

SUBSCRIBE_GDRIVE_NOTIFICATIONS_PATH = '/google/scan/subscribenotifications'
PROCESS_GDRIVE_NOTIFICATIONS_PATH = '/google/scan/processnotifications'
HANDLE_GDRIVE_CHANNEL_EXPIRATION_PATH = '/google/scan/handlechannelexpiration'
PROCESS_GDRIVE_DIRECTORY_NOTIFICATIONS_PATH = '/google/scan/directoryprocessnotifications'

GET_USER_GROUP_TREE_PATH = "/common/getusergrouptree"
GET_APPS = "/common/getappsdata"
GET_RESOURCE_TREE_PATH = "/common/getresourcetree"
GET_DATASOURCE_PATH = '/common/datasources'

ASYNC_DELETE_DATASOURCE_PATH = '/common/asyncdatasourcedelete'

GET_SCHEDULED_REPORT_PATH = '/common/scheduledreport'
RUN_SCHEDULED_REPORT = '/common/scheduledreport/runreport'

GET_ACTIVITIES_FOR_USER_PATH = '/common/getactivitiesforuser'

GET_ALL_ACTIONS_PATH = '/common/getallactions'
INITIATE_ACTION_PATH = '/common/initiateaction'

GET_AUDITLOG_PATH = '/common/getauditlog'

POLICIES_PATH = '/common/policies'
POLICIES_VALIDATE_PATH = '/common/policies/validate'



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

class ResponseType(Enum):
    ERROR = 'error'


class DocType(Enum):
    PUBLIC_COUNT = 'Shared public links'
    EXTERNAL_COUNT = 'Shared with users outside company'
    DOMAIN_COUNT = 'Shared across company'

class PolicyTriggerType(Enum):
    PERMISSION_CHANGE = 'PERMISSION_CHANGE'

class PolicyMatchType(Enum):
    DOCUMENT_NAME = 'DOCUMENT_NAME'
    DOCUMENT_OWNER = 'DOCUMENT_OWNER'
    DOCUMENT_EXPOSURE = 'DOCUMENT_EXPOSURE'
    PERMISSION_EMAIL = "PERMISSION_EMAIL"

class policyActionType(Enum):
    SEND_EMAIL = "SEND_EMAIL"