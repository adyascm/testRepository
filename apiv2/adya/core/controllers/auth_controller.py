
from adya.common.db import db_utils

def get_user_session(auth_token):
    return db_utils.get_user_session(auth_token)

