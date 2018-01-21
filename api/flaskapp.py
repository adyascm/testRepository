import os
from flask import Flask
from flask_restful import Api
from api.adya.services.flask.authhandler import googleoauthlogin,googleoauthcallback

os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'

app = Flask(__name__)
api = Api(app)

api.add_resource(googleoauthlogin, '/api/googleoauthlogin')
api.add_resource(googleoauthcallback, '/api/googleoauthcallback')

if __name__ == '__main__':
    app.run(debug=True)