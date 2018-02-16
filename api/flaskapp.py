import os
from flask import Flask
from flask_restful import Api
from flask_cors import CORS

import db_config
from adya.services.flask import scanhandler, reports_handler, incremental_scan_handler
from adya.common import constants

from adya.services.flask.auth_handler import google_oauth_request,google_oauth_callback,get_user_session
from adya.services.flask.domain_handler import datasource
from adya.services.flask.domainDataHandler import UserGroupTree
from adya.services.flask.reports_handler import scheduled_report
from adya.services.flask.resourceHandler import GetResources
from flask_restful import request
from flask import make_response

os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'

app = Flask(__name__)
CORS(app)

api = Api(app)


#Add all routes here

## routes releated to google Oauth2

api.add_resource(google_oauth_request, constants.GOOGLE_OAUTH_LOGIN)
api.add_resource(google_oauth_callback, constants.GOOGLE_OAUTHCALLBACK_PATH)

api.add_resource(get_user_session, '/user')
api.add_resource(reports_handler.dashboard_widget, '/widgets')
## routes for scan user data for getting file meta data for each user and get user and group
## meta data for a domain
api.add_resource(scanhandler.DriveResources,constants.SCAN_RESOURCES)
api.add_resource(scanhandler.GetPermission, constants.SCAN_PERMISSIONS)
api.add_resource(scanhandler.GetParent, constants.SCAN_PARENTS)

api.add_resource(scanhandler.GetDomainuser, constants.SCAN_DOMAIN_USERS)

api.add_resource(scanhandler.GetDomainGroups, constants.SCAN_DOMAIN_GROUPS)

api.add_resource(scanhandler.GetGroupMembers, constants.SCAN_GROUP_MEMBERS)


api.add_resource(datasource, constants.GET_DATASOURCE_PATH)

## get user group tree
api.add_resource(UserGroupTree, constants.GET_USER_GROUP_TREE_PATH)
api.add_resource(incremental_scan_handler.subscribe, constants.SUBSCRIBE_GDRIVE_NOTIFICATIONS_PATH)
api.add_resource(incremental_scan_handler.trigger_process_notifications, constants.PROCESS_GDRIVE_NOTIFICATIONS_PATH)

# get file resource data
api.add_resource(GetResources,constants.GET_RESOURCE_TREE_PATH)

#create scheduled report
api.add_resource(scheduled_report, constants.GET_SCHEDULED_RESOURCE_PATH)

if __name__ == '__main__':
    app.run(debug=True, threaded=True)