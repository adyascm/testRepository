
import json
import datetime
import uuid

from adya.db.connection import db_connection
from adya.db.models import DataSource, LoginUser, Domain, AlchemyEncoder


def get_datasource(auth_token):
    session = db_connection().get_session()
    datasources = session.query(DataSource).filter(LoginUser.domain_id == DataSource.domain_id). \
        filter(LoginUser.auth_token == auth_token).all()

    return json.dumps(datasources, cls=AlchemyEncoder)

def create_datasource(auth_token, payload):
    datasource_id = str(uuid.uuid4())
    session = db_connection().get_session()

    existing_user = session.query(LoginUser).filter(LoginUser.auth_token == auth_token).first()
    if existing_user:
        datasource = DataSource()
        datasource.domain_id = existing_user.domain_id
        datasource.datasource_id = datasource_id
        if payload:
            datasource.display_name = payload["display_name"]
        else:
            datasource.display_name = "test"
        # we are fixing the datasoure type this can be obtained from the frontend
        datasource.datasource_type = "GSUITE"
        datasource.creation_time = datetime.datetime.utcnow().isoformat()
        session.add(datasource)
        session.commit()
        return json.dumps(datasource, cls=AlchemyEncoder)
    else:
        return None

def create_domain(domain_id, domain_name):
    session = db_connection().get_session()
    creation_time = datetime.datetime.utcnow().isoformat()

    domain = Domain()
    domain.domain_id = domain_id
    domain.domain_name = domain_name
    domain.creation_time = creation_time
    session.add(domain)
    session.commit()
    return domain


