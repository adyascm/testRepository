from flask_restful import Resource,reqparse

from adya.controllers import datasourceController


class datasource(Resource):
    def get(self):
        parser = reqparse.RequestParser()
        parser.add_argument('authToken', type=str)
        args = parser.parse_args()

        if not args['authToken']:
            return {'message': 'Missing auth token'}, 400
        datasources = datasourceController.get_datasource(args['authToken'])

        return datasources, 200


