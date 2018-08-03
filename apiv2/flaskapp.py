import os
from flask import Flask
from flask_restful import Api
from flask_cors import CORS

import db_config
from adya.common.constants import urls

from adya.gsuite.synchronizers import drive_change_notification
from adya.gsuite import flask_wrapper_gsuite
from adya.slack import flask_wrapper_slack
from adya.github import flask_wrapper_github
from adya.core import flask_wrapper_core
os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'

app = Flask(__name__)
CORS(app)

api = Api(app)


#Add all routes here

## routes releated to google Oauth2
api.add_resource(flask_wrapper_gsuite.google_oauth_request, urls.GOOGLE_OAUTH_LOGIN)
api.add_resource(flask_wrapper_gsuite.google_oauth_callback, urls.GOOGLE_OAUTHCALLBACK_PATH)

api.add_resource(flask_wrapper_core.get_user_session, '/common/user')
api.add_resource(flask_wrapper_core.DashboardWidget, '/common/widgets')
api.add_resource(flask_wrapper_core.AppStats, '/common/categoryexpenses')
## routes for scan user data for getting file meta data for each user and get user and group
## meta data for a domain
api.add_resource(flask_wrapper_gsuite.GSuiteScan, urls.SCAN_GSUITE_UPDATE)
api.add_resource(flask_wrapper_gsuite.GSuiteEntities, urls.SCAN_GSUITE_ENTITIES)

api.add_resource(flask_wrapper_core.datasource, urls.GET_DATASOURCE_PATH)
api.add_resource(flask_wrapper_core.asyncdatasourcedelete, urls.ASYNC_DELETE_DATASOURCE_PATH)
## get user group tree
api.add_resource(flask_wrapper_core.UserStats, urls.GET_USERS_STATS_PATH)
api.add_resource(flask_wrapper_core.UsersList, urls.GET_USERS_LIST_PATH)
api.add_resource(flask_wrapper_core.UserApps, urls.GET_APPS)
api.add_resource(flask_wrapper_core.GroupMembers, urls.GET_GROUP_MEMBERS)
api.add_resource(flask_wrapper_core.UsersExport, urls.USERS_EXPORT)

# incremental scan
api.add_resource(flask_wrapper_gsuite.subscribe, urls.SUBSCRIBE_GDRIVE_NOTIFICATIONS_PATH)
api.add_resource(flask_wrapper_gsuite.PollChanges, urls.GDRIVE_PERIODIC_CHANGES_POLL)
api.add_resource(flask_wrapper_gsuite.process_drive_notifications, urls.PROCESS_DRIVE_NOTIFICATIONS_PATH)
api.add_resource(flask_wrapper_gsuite.process_activity_notifications, urls.PROCESS_ACTIVITY_NOTIFICATIONS_PATH)

# get file resource data
api.add_resource(flask_wrapper_core.GetResources, urls.GET_RESOURCE_TREE_PATH)
api.add_resource(flask_wrapper_core.ResourcesExport, urls.RESOURCES_EXPORT)

#create scheduled report
api.add_resource(flask_wrapper_core.ScheduledReport, urls.GET_SCHEDULED_REPORT_PATH)
#run scheduled report
api.add_resource(flask_wrapper_core.RunReport, urls.RUN_SCHEDULED_REPORT)

# activities
api.add_resource(flask_wrapper_core.Activities, urls.GET_ALL_ACTIVITIES)
api.add_resource(flask_wrapper_gsuite.get_activities_for_user,
                 urls.GET_ACTIVITIES_FOR_USER_PATH)

# actions
api.add_resource(flask_wrapper_core.get_all_actions, urls.GET_ALL_ACTIONS_PATH)
api.add_resource(flask_wrapper_core.initiate_action, urls.INITIATE_ACTION_PATH)
api.add_resource(flask_wrapper_gsuite.ExecuteActions, urls.EXECUTE_GSUITE_ACTION)

api.add_resource(flask_wrapper_core.get_audit_log, urls.GET_AUDITLOG_PATH)

#policies
api.add_resource(flask_wrapper_core.Policy, urls.POLICIES_PATH)
api.add_resource(flask_wrapper_gsuite.PolicyValidator, urls.GSUITE_POLICIES_VALIDATE_PATH)
api.add_resource(flask_wrapper_slack.SlackPolicyValidator, urls.SLACK_POLICIES_VALIDATE_PATH)

#alerts
api.add_resource(flask_wrapper_core.Alert, urls.ALERTS_PATH)
api.add_resource(flask_wrapper_core.AlertsCount, urls.ALERTS_COUNT_PATH)

#trustedDomain
api.add_resource(flask_wrapper_core.TrustedEntities, urls.TRUSTED_ENTITIES)



#slack
api.add_resource(flask_wrapper_slack.slack_oauth_request, urls.SLACK_OAUTH_LOGIN)
api.add_resource(flask_wrapper_slack.slack_oauth_callback, urls.SLACK_OAUTHCALLBACK_PATH)

#slack scan
api.add_resource(flask_wrapper_slack.SlackScan, urls.SCAN_SLACK_UPDATE)
api.add_resource(flask_wrapper_slack.SlackEntities, urls.SCAN_SLACK_ENTITIES)

#slack actions
api.add_resource(flask_wrapper_slack.ExecuteSlackActions, urls.EXECUTE_SLACK_ACTION)

#slack incremental scan
api.add_resource(flask_wrapper_slack.ProcessSlackNotifications, urls.PROCESS_SLACK_NOTIFICATIONS_PATH)

#github_scan
api.add_resource(flask_wrapper_github.GithubEntities, urls.GITHUB_SCAN_ENTITIES)
api.add_resource(flask_wrapper_github.GithubScanUpdate, urls.GITHUB_SCAN_UPDATE)

#github
api.add_resource(flask_wrapper_github.github_oauth_request, urls.GITHUB_OAUTH_LOGIN)
api.add_resource(flask_wrapper_github.github_oauth_callback, urls.GITHUB_OAUTH_CALLBACK_PATH)
api.add_resource(flask_wrapper_github.ProcessGithubNotifications, urls.PROCESS_GITHUB_NOTIFICATIONS_PATH)

#github_actions
api.add_resource(flask_wrapper_github.ExecuteGithubActions, urls.EXECUTE_GITHUB_ACTION)
if __name__ == '__main__':
    app.run(debug=True, threaded=True)
