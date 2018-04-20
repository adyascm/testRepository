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

NEXT_CALL_FROM_FILE_ID = 4 * 60
INTERNAL_SECRET = "dfskdjfsd-sdfkjsdhfsdfk-sdfksdf"

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
    ANYONEWITHLINK = 'ANYONEWITHLINK'


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
    PUBLIC_COUNT = 'Publicly discoverable'
    EXTERNAL_COUNT = 'Shared with users outside company'
    DOMAIN_COUNT = 'Shared across company'
    ANYONE_WITH_LINK_COUNT = 'Shared public link'

class PolicyTriggerType(Enum):
    PERMISSION_CHANGE = 'PERMISSION_CHANGE'

class PolicyMatchType(Enum):
    DOCUMENT_NAME = 'DOCUMENT_NAME'
    DOCUMENT_OWNER = 'DOCUMENT_OWNER'
    DOCUMENT_EXPOSURE = 'DOCUMENT_EXPOSURE'
    PERMISSION_EMAIL = "PERMISSION_EMAIL"

class policyActionType(Enum):
    SEND_EMAIL = "SEND_EMAIL"

class TriggerType(Enum):
    ASYNC = "ASYNC"
    SYNC = "SYNC"


Permission_Role_mapping = {
    'can_edit': 'writer',
    'can_view': 'reader',
    'owner': 'owner',
    'can_comment': 'commenter'
}

permission_priority = {
    "can_view": 1,
    "can_comment": 2,
    "can_edit": 3
}


class TypeOfPushNotificationCallback(Enum):
    DRIVE_CHANGE = 'DRIVE_CHANGE'
    ACTIVITY_CHANGE = 'ACTIVITY_CHANGE'
