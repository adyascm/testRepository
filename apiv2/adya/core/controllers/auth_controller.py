
import datetime, json

from adya.common.db import db_utils
from adya.common.db.models import LoginUser, alchemy_encoder
from adya.common.db.connection import db_connection

def get_user_session(auth_token):
    db_session = db_connection().get_session()
    user_session = db_utils.get_user_session(auth_token, db_session)
    db_session.query(LoginUser).filter(LoginUser.auth_token == auth_token).update({"last_login_time":datetime.datetime.utcnow()})
    db_connection().commit()
    user_session = json.loads(json.dumps(user_session, cls=alchemy_encoder()))
    user_session["refresh_token"] = ""
    user_session["token"] = ""
    return user_session

