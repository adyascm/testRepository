import json
import datetime
import uuid

from adya.db.models import Domain, LoginUser, DomainUser
from adya.db.connection import db_connection
from adya.common import utils, constants
from adya.email_templates import adya_emails
from sqlalchemy import and_

def get_user_session(auth_token):
    if not auth_token:
        return None
    db_session = db_connection().get_session()
    user = db_session.query(LoginUser).filter(LoginUser.auth_token == auth_token).first()
    if user:
        domain_user = db_session.query(DomainUser).filter(and_(DomainUser.member_type == constants.UserMemberType.INTERNAL, DomainUser.email == user.email)).first()
        if domain_user:
            user.is_admin = domain_user.is_admin
    return user

def get_user(email, db_session=None):
    if not db_session:
        db_session = db_connection().get_session()
    user = db_session.query(LoginUser).filter(LoginUser.email == email).first()
    return user

def create_user(email, first_name, last_name, domain_id, refresh_token, is_serviceaccount_enabled,scope_name):
    db_session = db_connection().get_session()
    creation_time = datetime.datetime.utcnow().isoformat()
    auth_token = str(uuid.uuid4())

    login_user = LoginUser()
    login_user.email = email
    login_user.first_name = first_name
    login_user.last_name = last_name
    login_user.auth_token = auth_token
    login_user.domain_id = domain_id
    login_user.refresh_token = refresh_token
    login_user.is_serviceaccount_enabled = is_serviceaccount_enabled
    login_user.creation_time = creation_time
    login_user.last_login_time = creation_time
    login_user.authorize_scope_name = scope_name
    db_session.add(login_user)
    db_connection().commit()

    adya_emails.send_welcome_email(login_user)

    return login_user