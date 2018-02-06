import json
import datetime
import uuid

from adya.db.models import LoginUser, DomainGroup, DomainUser, Resource
from adya.db.connection import db_connection

def get_widget_data(auth_token, widget_id):
    if not auth_token:
        return None
    session = db_connection().get_session()
    data = None
    if widget_id == 'usersCount':
        data = session.query(DomainUser).filter(DomainUser.domain_id == LoginUser.domain_id).filter(LoginUser.auth_token == auth_token).count()
    elif widget_id == 'groupsCount':
        data = 4 #data = session.query(DomainGroup).filter(DomainGroup.domain_id == LoginUser.domain_id).filter(LoginUser.auth_token == auth_token).count()
    elif widget_id == 'filesCount':
        data = session.query(Resource).filter(Resource.domain_id == LoginUser.domain_id).filter(LoginUser.auth_token == auth_token).count()
    elif widget_id == 'foldersCount':
        data = session.query(Resource).filter(Resource.domain_id == LoginUser.domain_id).filter(LoginUser.auth_token == auth_token).count()
    elif widget_id == 'sharedDocsByType':
        #data = session.query(Resource).filter(Resource.domain_id == LoginUser.domain_id).filter(LoginUser.auth_token == auth_token).count()
        data = {"Public": "4", "Domain": "6"}
    elif widget_id == 'sharedDocsList':
        #data = session.query(Resource).filter(Resource.domain_id == LoginUser.domain_id).filter(LoginUser.auth_token == auth_token).all()
        data = [{"name": "confidentials.doc", "last_accessed": "10 mins"}]
    elif widget_id == 'externalUsersList':
        #data = session.query(Resource).filter(Resource.domain_id == LoginUser.domain_id).filter(LoginUser.auth_token == auth_token).count()
        data = [{"name": "amit", "last_active": "10 mins"}]
    return data

    