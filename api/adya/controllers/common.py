from adya.db.models import LoginUser, DomainUser
from adya.db.connection import db_connection
from adya.common import constants
from sqlalchemy import and_

def get_user_session(auth_token, db_session = None):
    if not auth_token:
        return None
    if not db_session:
        db_session = db_connection().get_session()
    user = db_session.query(LoginUser).filter(LoginUser.auth_token == auth_token).first()
    if user:
        domain_user = db_session.query(DomainUser).filter(and_(DomainUser.member_type == constants.UserMemberType.INTERNAL, DomainUser.email == user.email)).first()
        if domain_user:
            user.is_admin = domain_user.is_admin
        else:
            user.is_admin = True
    return user