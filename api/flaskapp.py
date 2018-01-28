import os
from flask import Flask
from flask_restful import Api
from adya.services.flask.authhandler import googleoauthlogin,googleoauthcallback
from adya.services.flask.scanhandler import initialgdrivescan,processResources,getPermission,getdomainuser,gdriveScan

os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'

app = Flask(__name__)
api = Api(app)

#Add all routes here
api.add_resource(googleoauthlogin, '/googleoauthlogin')
api.add_resource(googleoauthcallback, '/googleoauthcallback')
api.add_resource(gdriveScan,'/gdrivescan')
api.add_resource(processResources,'/processresources')
api.add_resource(getPermission,'/permisssions')
api.add_resource(getdomainuser,'/getdomainuser')
api.add_resource(initialgdrivescan,'/initialgdrivescan')

if __name__ == '__main__':
    app.run(debug=True)