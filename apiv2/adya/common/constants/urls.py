from adya.common.constants import constants

GOOGLE_OAUTHCALLBACK_PATH = "/google/oauthcallback"
GOOGLE_OAUTH_LOGIN = '/google/oauthlogin'
GOOGLE_OAUTH_CALLBACK_URL = constants.API_HOST + GOOGLE_OAUTHCALLBACK_PATH
OAUTH_STATUS_PATH = "/oauthstatus"
OAUTH_STATUS_URL = constants.UI_HOST + OAUTH_STATUS_PATH

SCAN_START = "/google/scan/start"
SCAN_RESOURCES = "/google/scan/resources"
SCAN_PERMISSIONS = "/google/scan/permisssions"
SCAN_PARENTS = "/google/scan/parents"
SCAN_DOMAIN_USERS = "/google/scan/domainusers"
SCAN_DOMAIN_GROUPS = "/google/scan/domaingroups"
SCAN_GROUP_MEMBERS = "/google/scan/groupmembers"
SCAN_USERS_APP = '/google/scan/usersapp'

SUBSCRIBE_GDRIVE_NOTIFICATIONS_PATH = '/google/scan/subscribenotifications'
SUBSCRIBE_GDRIVE_ACTIVITY_NOTIFICATIONS_PATH = '/google/scan/subscribeactivitynotifications'
PROCESS_DRIVE_NOTIFICATIONS_PATH = '/google/scan/processdrivenotifications'
PROCESS_ACTIVITY_NOTIFICATIONS_PATH = '/google/scan/processactivitynotifications'
HANDLE_GDRIVE_CHANNEL_EXPIRATION_PATH = '/google/scan/handlechannelexpiration'
GDRIVE_PERIODIC_CHANGES_POLL = '/google/scan/polldrivechanges'
PROCESS_GDRIVE_DIRECTORY_NOTIFICATIONS_PATH = '/google/scan/directoryprocessnotifications'
GET_ACTIVITIES_FOR_USER_PATH = '/google/getactivitiesforuser'
GSUITE_POLICIES_VALIDATE_PATH = '/google/policies/validate'

GET_USERS_LIST_PATH = "/common/users"
GET_USERS_STATS_PATH = "/common/users/stats"
GET_USER_GROUP_TREE_PATH = "/common/getusergrouptree"
GET_APPS = "/common/getappsdata"
GET_RESOURCE_TREE_PATH = "/common/getresourcetree"
GET_DATASOURCE_PATH = '/common/datasources'

ASYNC_DELETE_DATASOURCE_PATH = '/common/asyncdatasourcedelete'

GET_SCHEDULED_REPORT_PATH = '/common/scheduledreport'
RUN_SCHEDULED_REPORT = '/common/scheduledreport/runreport'
EXECUTE_SCHEDULED_REPORT = '/common/executescheduledreport'

GET_ALL_ACTIONS_PATH = '/common/getallactions'
INITIATE_ACTION_PATH = '/common/initiateaction'

GET_AUDITLOG_PATH = '/common/getauditlog'

POLICIES_PATH = '/common/policies'
CREATE_DEFAULT_POLICES_PATH ='/common/policies/default'

ALERTS_PATH = '/common/alerts'
ALERTS_COUNT_PATH = '/common/alerts/count'

ACTION_PATH = '/google/actions'

TRUSTED_ENTITIES = '/common/trustedentities'

# slack
SLACK_OAUTH_LOGIN = '/slack/oauthlogin'
SLACK_OAUTHCALLBACK_PATH = "/slack/oauthcallback"
SLACK_OAUTH_CALLBACK_URL = constants.API_HOST + SLACK_OAUTHCALLBACK_PATH


SLACK_ENDPOINT = "https://slack.com/oauth/authorize"


SCAN_SLACK_START = "/slack/scan/start"
SCAN_SLACK_USERS = '/slack/scan/users'
SCAN_SLACK_CHANNELS = '/slack/scan/channels'
SCAN_SLACK_FILES = '/slack/scan/resources'
SCAN_SLACK_APPS = '/slack/scan/apps'
PROCESS_SLACK_NOTIFICATIONS_PATH = '/slack/scan/processnotifications'
SLACK_ACTION_PATH = '/slack/actions'


