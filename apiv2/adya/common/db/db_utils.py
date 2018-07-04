from sqlalchemy.ext.declarative import DeclarativeMeta
from sqlalchemy.orm.attributes import InstrumentedAttribute
from sqlalchemy.orm.collections import InstrumentedList, InstrumentedDict

from adya.common.db.models import LoginUser, DomainUser, Domain, DataSource
from adya.common.db.connection import db_connection
from adya.common.constants import constants

from sqlalchemy import and_
import datetime, uuid


def get_user_session(auth_token, db_session=None):
    if not auth_token:
        return None
    if not db_session:
        db_session = db_connection().get_session()
    user = db_session.query(LoginUser).filter(
        LoginUser.auth_token == auth_token).first()
    if user:
        domain_user = db_session.query(DomainUser).filter(and_(
            DomainUser.member_type == constants.EntityExposureType.INTERNAL.value, DomainUser.email == user.email)).first()
        if domain_user:
            user.is_admin = domain_user.is_admin
        else:
            user.is_admin = True
        user.refresh_token = ""
        user.token = ""
    return user


def get_login_user_from_email(email, db_session=None):
    if not db_session:
        db_session = db_connection().get_session()
    return db_session.query(LoginUser).filter(LoginUser.email == email).first()


def create_user(email, first_name, last_name, domain_id, refresh_token, is_serviceaccount_enabled, scope_name, token,
                db_session=None):
    if not db_session:
        db_session = db_connection().get_session()
    creation_time = datetime.datetime.utcnow()
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
    login_user.token = token
    try:
        db_session.add(login_user)
        db_connection().commit()
        return login_user
    except:
        db_session.rollback()
        return None


def get_datasource(datasource_id, db_session=None):
    if not db_session:
        db_session = db_connection().get_session()
    return db_session.query(DataSource).filter(and_(
        DataSource.datasource_id == datasource_id, DataSource.is_async_delete == False)).first()


def create_domain(db_session, domain_id, domain_name):
    creation_time = datetime.datetime.utcnow()
    domain = {}
    domain["domain_id"] = domain_id
    domain["domain_name"] = domain_name
    domain["creation_time"] = creation_time
    try:
        db_session.execute(Domain.__table__.insert().prefix_with(
            "IGNORE").values([domain_id, domain_name, creation_time]))
        db_connection().commit()
    except:
        db_session.rollback()
    return domain


def get_model_values(type, value):
    mapped_values = {}
    for item in type.__dict__.iteritems():
        field_name = item[0]
        field_type = item[1]
        is_column = isinstance(field_type, InstrumentedAttribute)
        if is_column:
            field_value = getattr(value, field_name)
            is_foreign = isinstance(field_value, InstrumentedList) or isinstance(field_value, InstrumentedDict) or isinstance(field_value.__class__, DeclarativeMeta)
            if not is_foreign:
                mapped_values[field_name] = field_value

    return mapped_values
