import json
import datetime
import uuid

from adya.db.models import Domain, LoginUser,AlchemyEncoder
from adya.db.connection import db_connection


def get_user_session(auth_token):
    if not auth_token:
        return None
    session = db_connection().get_session()
    user = session.query(LoginUser).filter(LoginUser.auth_token == auth_token).first()
    return json.dumps(user, cls=AlchemyEncoder)


def create_user(email, first_name, last_name, domain_id, refresh_token, is_enterprise_user):
    session = db_connection().get_session()
    creation_time = datetime.datetime.utcnow().isoformat()
    auth_token = str(uuid.uuid4())

    login_user = LoginUser()
    login_user.email = email
    login_user.first_name = first_name
    login_user.last_name = last_name
    login_user.auth_token = auth_token
    login_user.domain_id = domain_id
    login_user.refresh_token = refresh_token
    login_user.is_enterprise_user = is_enterprise_user
    login_user.creation_time = creation_time
    login_user.last_login_time = creation_time

    session.add(login_user)
    session.commit()
    return login_user