import json
from adya.db.models import Domain, LoginUser,AlchemyEncoder
from adya.db.connection import db_connection

def get_user_session(auth_token):
    if not auth_token:
        return None
    session = db_connection().get_session()
    user = session.query(LoginUser).filter(LoginUser.auth_token == auth_token).first()
    return json.dumps(user, cls=AlchemyEncoder)
    