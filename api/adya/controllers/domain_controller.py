import json
import datetime
import uuid
from adya.common import utils

from requests_futures.sessions import FuturesSession

from adya.common import constants
from adya.db.connection import db_connection
from adya.db.models import DataSource, LoginUser, Domain, AlchemyEncoder



def get_datasource(auth_token, datasource_id):
    session = db_connection().get_session()
    if datasource_id:
        datasources = session.query(DataSource).filter(DataSource.datasource_id == datasource_id). \
            filter(LoginUser.auth_token == auth_token).all()
    else:
        datasources = session.query(DataSource).filter(LoginUser.domain_id == DataSource.domain_id). \
        filter(LoginUser.auth_token == auth_token).all()

    return json.dumps(datasources, cls=AlchemyEncoder)


def update_datasource(datasource_id, column_name, column_value):
    session = db_connection().get_session()
    if column_name:
        datasources = session.query(DataSource).filter(DataSource.datasource_id == datasource_id). \
            update({column_name: column_name + column_value})
        session.commit()

        return datasources


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
        try:
            session.commit()
        except Exception as ex:
            print (ex)
        start_scan(auth_token,datasource.domain_id, datasource.datasource_id)
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


def start_scan(auth_token, domain_id, datasource_id):
    data = {"domainId": domain_id, "dataSourceId": datasource_id}
    session = FuturesSession()
    utils.post_call_with_authorization_header(session,url=constants.GET_DOMAIN_USER_URL,auth_token=auth_token, data=data)
    utils.post_call_with_authorization_header(session,url=constants.GET_GROUP_URL,auth_token=auth_token, data=data)
    utils.post_call_with_authorization_header(session,url=constants.INITIAL_GDRIVE_SCAN,auth_token=auth_token, data=data)







