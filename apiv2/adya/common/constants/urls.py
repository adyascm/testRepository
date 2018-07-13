from adya.common.constants import constants

GOOGLE_OAUTHCALLBACK_PATH = "/google/oauthcallback"
GOOGLE_OAUTH_LOGIN = '/google/oauthlogin'
GOOGLE_OAUTH_CALLBACK_URL = constants.API_HOST + GOOGLE_OAUTHCALLBACK_PATH
OAUTH_STATUS_PATH = "/oauthstatus"
OAUTH_STATUS_URL = constants.UI_HOST + OAUTH_STATUS_PATH

SCAN_GSUITE_UPDATE = "/google/scan"
SCAN_GSUITE_ENTITIES = '/google/scan/entities'

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
GET_APPS = "/common/getappsdata"
GET_RESOURCE_TREE_PATH = "/common/getresourcetree"
GET_DATASOURCE_PATH = '/common/datasources'
GET_GROUP_MEMBERS = '/common/getgroupmembers'
RESOURCES_EXPORT = '/common/resource/export'
USERS_EXPORT = '/common/users/export'

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

TRUSTED_ENTITIES = '/common/trustedentities'

# slack
SLACK_OAUTH_LOGIN = '/slack/oauthlogin'
SLACK_OAUTHCALLBACK_PATH = "/slack/oauthcallback"
SLACK_OAUTH_CALLBACK_URL = constants.API_HOST + SLACK_OAUTHCALLBACK_PATH


SLACK_ENDPOINT = "https://slack.com/oauth/authorize"


SCAN_SLACK_UPDATE = "/slack/scan"
SCAN_SLACK_ENTITIES = '/slack/scan/entities'
PROCESS_SLACK_NOTIFICATIONS_PATH = '/slack/scan/processnotifications'

# slack actions:
SLACK_FILES_ACTION_PATH = '/slack/filesactions'
SLACK_USER_ACTION_PATH = '/slack/usersactions'


#slack policy
SLACK_POLICIES_VALIDATE_PATH = '/slack/policies/validate'

#execute action:
EXECUTE_GSUITE_ACTION = '/google/execute/actions'
EXECUTE_SLACK_ACTION = '/slack/execute/actions'
EXECUTE_GITHUB_ACTION = '/github/execute/actions'

#apps licenses
INSTALLED_APPS = "/common/installedapps"
AVAILABLE_APPS = "/common/availableapps"

#github
GITHUB_OAUTH_LOGIN = '/github/oauthlogin'
GITHUB_OAUTH_CALLBACK_PATH = '/github/oauthcallback'
GITHUB_OAUTH_CALLBACK_URL = constants.API_HOST + GITHUB_OAUTH_CALLBACK_PATH
GITHUB_ENDPOINT = "https://github.com/login/oauth/authorize"
GITHUB_TOKEN_ENDPOINT = "https://github.com/login/oauth/access_token"

#github_scan_urls
GITHUB_SCAN_START = '/github/scan/start'
GITHUB_SCAN_USERS = '/github/scan/users'
GITHUB_SCAN_REPOSITORY = '/github/scan/repository'
GITHUB_SCAN_ENTITIES = '/github/scan/entities'
GITHUB_SCAN_UPDATE = '/github/scan'

#github_event_notifications
PROCESS_GITHUB_NOTIFICATIONS_PATH = '/github/processnotifications'
GITHUB_NOTIFICATIONS_URL = constants.API_HOST + PROCESS_GITHUB_NOTIFICATIONS_PATH