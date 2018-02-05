import os
from flask import Flask
from flask_restful import Api
from flask_cors import CORS

from adya.services.flask import scanhandler
from adya.common import constants
from adya.services.flask.authhandler import google_oauth_request,google_oauth_callback,get_user_session
from adya.services.flask.domainhandler import datasource

os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'

app = Flask(__name__)
CORS(app)
api = Api(app, "/api")

#Add all routes here

## routes releated to google Oauth2

api.add_resource(google_oauth_request, constants.GOOGLE_OAUTH_LOGIN)
api.add_resource(google_oauth_callback, constants.GOOGLE_OAUTHCALLBACK_PATH)

api.add_resource(get_user_session, '/user')
## routes for scan user data for getting file meta data for each user and get user and group
## meta data for a domain
api.add_resource(scanhandler.gdriveScan,constants.GDRIVE_SCAN_PATH)
api.add_resource(scanhandler.initialgdrivescan,constants.INITIAL_GDRIVE_SCAN_PATH)

api.add_resource(scanhandler.processResources,constants.PROCESS_RESOURCES_PATH)
api.add_resource(scanhandler.getPermission, constants.GET_PERMISSION_PATH)

api.add_resource(scanhandler.getdomainuser, constants.GET_DOMAIN_USER_PATH)
api.add_resource(scanhandler.processUsers, constants.PROCESS_USERS_PATH)

api.add_resource(scanhandler.getdomainGroups, constants.GET_DOMAIN_GROUP_PATH)
api.add_resource(scanhandler.processGroups,constants.PROCESS_GROUP_PATH)
api.add_resource(scanhandler.getGroupMembers, constants.GET_GROUP_MEMBERS_PATH)
api.add_resource(scanhandler.processGroupMembers,constants.PROCESS_GROUP_MEMBER_PATH)

api.add_resource(datasource, constants.GET_DATASOURCE_URL)

if __name__ == '__main__':
    app.run(debug=True)