import json
from adya.db.models import AlchemyEncoder, LoginUser, DataSource
from adya.common.constants import API_HOST

def bg_cb(sess, resp):
    # parse the json storing the result on the response object
    print "API request finished with response code - " + resp.status_code
    print "Dumping the session object - " + sess
    print "Dumping the response object - " + sess

def get_call_with_authorization_header(session, url, auth_token):
    headers = {"Authorization": auth_token}
    if not url.startswith('http'):
        url = API_HOST + url
    print "Making a GET request on the following url - " + url
    return session.get(url=url, headers=headers, background_callback=bg_cb)


def post_call_with_authorization_header(session, url, auth_token, json):
    headers = {"Authorization": auth_token, "Content-Type": "application/json"}
    if not url.startswith('http'):
        url = API_HOST + url
    print "Making a POST request on the following url - " + url
    session.post(url=url, json=json, headers=headers, background_callback=bg_cb)


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
