import os
from flask import Flask
from flask_restful import Api
from adya.services.flask.authhandler import googleoauthlogin,googleoauthcallback
from adya.services.flask.scanhandler import initialDSScan,processResources,getPermission

os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'

app = Flask(__name__)
api = Api(app)

#Add all routes here
api.add_resource(googleoauthlogin, '/googleoauthlogin')
api.add_resource(googleoauthcallback, '/googleoauthcallback')
api.add_resource(initialDSScan,'/gdrivescan')
api.add_resource(processResources,'/processresources')
api.add_resource(getPermission,'/permisssions')

if __name__ == '__main__':
    app.run(debug=True)