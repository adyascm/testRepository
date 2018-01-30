import urlparse

from flask_restful import Resource,reqparse,request
from adya.datasources.google import authProvider
from adya.controllers import authController


class googleoauthlogin(Resource):
    def get(self):
        url = authProvider.login_request()
        return {'location': url}, 301, {'location': url}

class googleoauthcallback(Resource):
    def get(self):
        parser = reqparse.RequestParser()
        parser.add_argument('error', type=str, help='Error if oauth failed')
        args = parser.parse_args()
        url = authProvider.login_callback(request.url, args['error'])
        if not url:
            return {'message': 'Not authenticated'}, 401
        else:
            return {'location': url}, 301, {'location': url}

class UserSession(Resource):
    def get(self):
        req = request
        auth_token = req.headers.get('Authorization')
        if not auth_token:
            return {'message': 'Missing auth token'}, 400
        user_session = authController.get_user_session(auth_token)
        if not user_session:
            return {'message': 'Not authenticated'}, 401
        else:
            return user_session, 200

