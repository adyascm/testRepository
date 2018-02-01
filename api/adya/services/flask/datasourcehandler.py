from flask_restful import Resource,reqparse

from adya.db.connection import db_connection
from adya.db.models import DataSource, LoginUser


class datasource(Resource):
    def get(self):
        parser = reqparse.RequestParser()
        parser.add_argument('authToken', type=str)
        args = parser.parse_args()
        session = db_connection().get_session()
        existing_datasources = session.query(DataSource).filter(LoginUser.domain_id == DataSource.domain_id).\
            filter(LoginUser.auth_token == args['authtoken']).all()

        return existing_datasources
