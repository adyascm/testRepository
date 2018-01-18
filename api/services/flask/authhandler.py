from flask_restful import Resource
from datasources.google import authProvider

class oauthloginrequest(Resource):
    def get(self):
        url = authProvider.login_request()
        return {'location': url}, 301, {'location': url}

class oauthlogincallback(Resource):
    def post(self):
        url = authProvider.login_request()
        return {'location': url}, 200, {'location': url}

