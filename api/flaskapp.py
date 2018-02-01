import os
from flask import Flask
from flask_restful import Api
from adya.services.flask.authhandler import googleoauthlogin,googleoauthcallback
from adya.services.flask import scanhandler
from adya.common import constants

os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'

app = Flask(__name__)
api = Api(app)

#Add all routes here

## routes releated to google Oauth2

api.add_resource(googleoauthlogin, constants.GOOGLE_OAUTH_LOGIN)
api.add_resource(googleoauthcallback, constants.GOOGLE_OAUTHCALLBACK_PATH)


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




if __name__ == '__main__':
    app.run(debug=True)