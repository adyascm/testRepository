import json
from adya.db.models import AlchemyEncoder, LoginUser, DataSource
from adya.common.constants import API_HOST


def get_call_with_authorization_header(session, url, auth_token):
    headers = {"Authorization": auth_token}
    if not url.startswith('http'):
        url = API_HOST + url
    print "Making a GET request on the following url - " + url
    return session.get(url=url, headers=headers)


def post_call_with_authorization_header(session, url, auth_token, json):
    headers = {"Authorization": auth_token, "Content-Type": "application/json"}
    if not url.startswith('http'):
        url = API_HOST + url
    print "Making a POST request on the following url - " + url
    session.post(url=url, json=json, headers=headers)


def get_domain_id_and_datasource_id_list(db_session, auth_token):
    domain_id = get_domain_id(db_session, auth_token)
    datasource_id_list_data = db_session.query(DataSource.datasource_id).filter(
        DataSource.domain_id == domain_id).all()
    return domain_id, datasource_id_list_data


def get_domain_id(db_session, auth_token):
    existing_user = db_session.query(LoginUser).filter(
        LoginUser.auth_token == auth_token).first()
    domain_id = existing_user.domain_id
    return domain_id
