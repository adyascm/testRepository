from flask import json

from adya.db.connection import db_connection
from adya.db.models import DataSource, LoginUser, AlchemyEncoder


def get_datasource(auth_token):

    session = db_connection().get_session()
    datasources = session.query(DataSource).filter(LoginUser.domain_id == DataSource.domain_id). \
        filter(LoginUser.auth_token == auth_token).all()

    return json.dumps(datasources, cls=AlchemyEncoder)


