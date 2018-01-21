from flask_restful import Resource,reqparse,request
from adya.datasources.google import authProvider

class googleoauthlogin(Resource):
    def get(self):
        url = authProvider.login_request()
        return {'location': url}, 301, {'location': url}

class googleoauthcallback(Resource):
    def get(self):
        req = request
        parser = reqparse.RequestParser()
        parser.add_argument('error', type=str, help='Error if oauth failed')
        args = parser.parse_args()
        url = authProvider.login_callback(req.url, args['error'])
        if not url:
            return {'message': 'Not authenticated'}, 401
        else:
            return {'location': url}, 301, {'location': url}

