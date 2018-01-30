import os
from flask import Flask
from flask_restful import Api
from adya.services.flask.authhandler import googleoauthlogin,googleoauthcallback
from adya.services.flask import scanhandler

os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'

app = Flask(__name__)
api = Api(app)

#Add all routes here

## routes releated to google Oauth2
api.add_resource(googleoauthlogin, '/googleoauthlogin')
api.add_resource(googleoauthcallback, '/googleoauthcallback')


## routes for scan user data for getting file meta data for each user and get user and group
## meta data for a domain
api.add_resource(scanhandler.gdriveScan,'/gdrivescan')
api.add_resource(scanhandler.initialgdrivescan,'/initialgdrivescan')

api.add_resource(scanhandler.processResources,'/processresources')
api.add_resource(scanhandler.getPermission,'/permisssions')

api.add_resource(scanhandler.getdomainuser,'/getdomainusers')
api.add_resource(scanhandler.processUsers,'/processusers')

api.add_resource(scanhandler.getdomainGroups,'/getgroups')
api.add_resource(scanhandler.processGroups,'/processgroups')




if __name__ == '__main__':
    app.run(debug=True)