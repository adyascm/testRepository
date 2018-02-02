import urlparse

from flask_restful import Resource, reqparse, request
from adya.datasources.google import auth
from adya.controllers import auth_controller
from adya.datasources.google import gutils

class google_oauth_request(Resource):
    def get(self):
        parser = reqparse.RequestParser()
        parser.add_argument('scope', type=str)
        args = parser.parse_args()
        url = auth.oauth_request(args['scope'])
        return {'location': url}, 301, {'location': url}


class google_oauth_callback(Resource):
    def get(self):
        parser = reqparse.RequestParser()
        scopes = request.args["scope"]
        parser.add_argument('error', type=str, help='Error if oauth fails')
        args = parser.parse_args()
        url = auth.oauth_callback(request.url, scopes, args['error'])
        if not url:
            return {'message': 'Not authenticated'}, 401
        else:
            return {'location': url}, 301, {'location': url}


class get_user_session(Resource):
    def get(self):
        req = request
        auth_token = req.headers.get('Authorization')
        if not auth_token:
            return {'message': 'Missing auth token'}, 400
        user_session = auth_controller.get_user_session(auth_token)
        if not user_session:
            return {'message': 'Not authenticated'}, 401
        else:
            return user_session, 200


class RevokeAccessForApp(Resource):
    def delete(self):
        data = request.data
        domain_id = data.get("domainId")
        gutils.revoke_appaccess(domain_id)
        return "Success Removed",200

