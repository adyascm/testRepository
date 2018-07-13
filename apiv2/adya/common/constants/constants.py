import os
from enum import Enum

from adya.common.constants import default_policies

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

ACTIVITY_DB_HOST = os.environ.get('ACTIVITY_DB_HOST', 'localhost')
ACTIVITY_DB_PORT = os.environ.get('ACTIVITY_DB_PORT', 8086)
ACTIVITY_DB_USERNAME = os.environ.get('ACTIVITY_DB_USERNAME', 'root')
ACTIVITY_DB_PWD = os.environ.get('ACTIVITY_DB_PWD', 'root')
ACTIVITY_DB_NAME = os.environ.get('ACTIVITY_DB_NAME', 'dev')

NEXT_CALL_FROM_FILE_ID = 4 * 60
INTERNAL_SECRET = "dfskdjfsd-sdfkjsdhfsdfk-sdfksdf"

#S3 credentials
ACCESS_KEY_ID = "AKIAJPLJBPKPNVQJDGFA"
SECRET_ACCESS_KEY = "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"

def get_url_from_path(path):
    return API_HOST + path

SUCCESS_STATUS_CODE = 200

REAL_TIME_URL = 'http://ortc-developers2-euwest1-s0001.realtime.co/send'

class EntityExposureType(Enum):
    PRIVATE = "PVT"
    INTERNAL = "INT"
    DOMAIN = "DOMAIN"
    EXTERNAL = "EXT"
    PUBLIC = "PUBLIC"
    ANYONEWITHLINK = 'ANYONEWITHLINK'
    TRUSTED = 'TRUST'

class DirectoryEntityType(Enum):
    USER = "USER"
    GROUP = "GROUP"
    CHANNEL = "CHANNEL"
    BOT = "BOT"
    ORGANIZATION = "ORGANIZATION"

class Role(Enum):
    ORGANIZER = 'organizer'
    OWNER = 'owner'
    WRITER = 'writer'
    COMMENTER = 'commenter'
    READER = 'reader'
    ADMIN = 'admin'

class ActionType(Enum):
    ADD = 'add'
    CHANGE = 'change'
    DELETE = 'delete'

PAGE_LIMIT = 50
INVENTORY_APPS_PAGE_LIMIT = 10
INSTALLED_APPS_PAGE_LIMIT = 50


class PolicyConditionMatch(Enum):
    CONTAIN = 'contain'
    EQUAL = 'equal'
    NOTEQUAL = 'notequal'
    GREATER = 'greater'

class ResponseType(Enum):
    ERROR = 'error'
    SUCCESS = 'success'


class DocType(Enum):
    PUBLIC_COUNT = 'Publicly discoverable'
    EXTERNAL_COUNT = 'Shared with users outside company'
    DOMAIN_COUNT = 'Shared across company'
    ANYONE_WITH_LINK_COUNT = 'Shared public link'
    TRUSTED = 'Shared with trusted domain'

class PolicyTriggerType(Enum):
    PERMISSION_CHANGE = 'PERMISSION_CHANGE'
    APP_INSTALL = 'APP_INSTALL'

class PolicyMatchType(Enum):
    DOCUMENT_NAME = 'DOCUMENT_NAME'
    DOCUMENT_OWNER = 'DOCUMENT_OWNER'
    DOCUMENT_EXPOSURE = 'DOCUMENT_EXPOSURE'
    PERMISSION_EMAIL = 'PERMISSION_EMAIL'
    APP_NAME = 'APP_NAME'
    APP_RISKINESS = 'APP_RISKINESS'

class PolicyActionType(Enum):
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


class GSuiteNotificationType(Enum):
    DRIVE_CHANGE = 'DRIVE_CHANGE'
    DRIVE_ACTIVITY = 'drive'
    ADMIN_ACTIVITY = 'admin'
    TOKEN_ACTIVITY = 'token'
    LOGIN_ACTIVITY = 'login'

class ConnectorTypes(Enum):
    GSUITE = "GSUITE"
    SLACK = "SLACK"
    GITHUB = "GITHUB"

datasource_to_default_policy_map = {
    ConnectorTypes.SLACK.value: default_policies.default_policies_slack,
    ConnectorTypes.GSUITE.value: default_policies.default_policies_gsuite
}

class BillingCycle(Enum):
    MONTHLY = "MONTHLY"
    YEARLY = "YEARLY"

class PricingModel(Enum):
    MONTHLY = "MONTHLY"
    YEARLY = "YEARLY"

datasource_to_installed_app_map = {
    'GSUITE' : 'G Suite',
    'SLACK' : 'Slack',
    'GITHUB': 'Github'
}

class TrustedTypes(Enum):
    DOMAINS = 'DOMAINS'
    APPS = 'APPS'