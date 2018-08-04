import os
from enum import Enum

from adya.common.constants import default_policies
from adya.common.constants import default_reports

os.environ["OAUTHLIB_RELAX_TOKEN_SCOPE"] = '1'
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
ACTIVITY_DB_PORT = os.environ.get('ACTIVITY_DB_PORT', '27017')
ACTIVITY_DB_USERNAME = os.environ.get('ACTIVITY_DB_USERNAME', 'root')
ACTIVITY_DB_PWD = os.environ.get('ACTIVITY_DB_PWD', 'root')

NEXT_CALL_FROM_FILE_ID = 4 * 60
INTERNAL_SECRET = "dfskdjfsd-sdfkjsdhfsdfk-sdfksdf"

def get_url_from_path(path):
    return API_HOST + path

SUCCESS_STATUS_CODE = 200
ACCEPTED_STATUS_CODE = 202

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
    NEW_USER = 'NEW_USER'

class PolicyMatchType(Enum):
    DOCUMENT_NAME = 'DOCUMENT_NAME'
    DOCUMENT_OWNER = 'DOCUMENT_OWNER'
    DOCUMENT_EXPOSURE = 'DOCUMENT_EXPOSURE'
    PERMISSION_EMAIL = 'PERMISSION_EMAIL'
    APP_NAME = 'APP_NAME'
    APP_RISKINESS = 'APP_RISKINESS'
    USER_TYPE = 'USER_TYPE'
    USER_ROLE = 'USER_ROLE'
    IS_APP_WHITELISTED = 'IS_APP_WHITELISTED'

class PolicyActionType(Enum):
    SEND_EMAIL = "SEND_EMAIL"
    REVERT = "REVERT"

class TriggerType(Enum):
    ASYNC = "ASYNC"
    SYNC = "SYNC"


Permission_Role_mapping = {
    'can_edit': 'writer',
    'can_view': 'reader',
    'owner': 'owner',
    'can_comment': 'commenter'
}

permission_friendly_name_map = {
    "owner": "Owner",
    "writer": "Can Write",
    "reader": "Can Read",
    "commenter": "Can Comment",
    "admin": "Admin",
    "organizer": "Can Organise"
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

datasource_to_default_report_map = {
    ConnectorTypes.SLACK.value: default_reports.default_reports_slack,
    ConnectorTypes.GSUITE.value: default_reports.default_reports_gsuite
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

COMMON_TAGS = [{"key": "domain_id", "desc": "Customer's domain", "default": ""},
               {"key": "connector_type", "desc": "SaaS application name", "default": "GSUITE"},
               {"key": "actor", "desc": "Entity triggering this event", "default": ""}]

permission_exposure_to_event_constants = {
    EntityExposureType.PUBLIC.value: 'FILE_SHARE_PUBLIC',
    EntityExposureType.ANYONEWITHLINK.value: 'FILE_SHARE_ANYONEWITHLINK',
    EntityExposureType.EXTERNAL.value: 'FILE_SHARE_EXTERNAL'
}