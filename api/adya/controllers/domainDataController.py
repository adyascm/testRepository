from adya.db.models import DirectoryStructure, LoginUser, DataSource, DomainUser, DomainGroup,Application
from adya.db.connection import db_connection
from sqlalchemy import and_
import json
from adya.common import utils

def get_user_group_tree(auth_token):

    db_session = db_connection().get_session()
    existing_user = db_session.query(LoginUser).filter(LoginUser.auth_token == auth_token).first()
    user_domain_id = existing_user.domain_id
    datasource_id_list_data = db_session.query(DataSource.datasource_id).filter(DataSource.domain_id == user_domain_id).all()

    #userGrouptrees ={}

    for datasource in datasource_id_list_data:
        datasource_id = datasource.datasource_id
        users_groups = {}        
        getUsersData(users_groups,db_session, domain_id=user_domain_id, datasource_id= datasource_id)
        getGroupData(users_groups,db_session, domain_id=user_domain_id, datasource_id= datasource_id)
        
        parent_child_data_array = db_session.query(DirectoryStructure.parent_email,DirectoryStructure.member_email)\
            .filter(and_(DirectoryStructure.domain_id == user_domain_id,DirectoryStructure.datasource_id == datasource_id)).all()
        
        for parent_child_data in parent_child_data_array:
            parent_email = parent_child_data.parent_email
            child_email = parent_child_data.member_email
            if child_email in users_groups:
                users_groups[child_email].parents.append(parent_email)
                users_groups[parent_email].children.append(child_email)
        #userGrouptrees[datasource_id] = users_groups
    return users_groups


def getUsersData(users_groups,db_session, domain_id, datasource_id):
    usersData = db_session.query(DomainUser)\
            .filter(and_(DomainUser.domain_id == domain_id,DomainUser.datasource_id == datasource_id)).all()
    for userdata in usersData:
        userdata.parents = []
        users_groups[userdata.email] = userdata


def getGroupData(users_groups,db_session, domain_id, datasource_id):
    groupsData = db_session.query(DomainGroup) \
        .filter(and_(DomainGroup.domain_id == domain_id, DomainGroup.datasource_id == datasource_id)).all()
    for groupdata in groupsData:
        groupdata.parents = []
        groupdata.children = []
        users_groups[groupdata.email] = groupdata

def get_apps(auth_token):

    db_session = db_connection().get_session()
    existing_user = db_session.query(LoginUser).filter(LoginUser.auth_token == auth_token).first()
    user_domain_id = existing_user.domain_id
    datasource_id_list_data = db_session.query(DataSource.datasource_id).filter(DataSource.domain_id == user_domain_id).all()

    for datasource in datasource_id_list_data:
        datasource_id = datasource.datasource_id
        apps_query_data = db_session.query(Application).filter(and_(Application.domain_id == user_domain_id, 
                                                    Application.datasource_id ==datasource_id)).all()
        apps ={}
        for app in apps_query_data:
            email = app.user_email
            client_id = app.client_id
            if not client_id in apps:
                app_obj = {}
                app_obj["domain_id"] = app.domain_id
                app_obj["datasource_id"] = app.datasource_id
                app_obj["client_id"] = app.client_id
                app_obj["user_emails"] = []
                app_obj["user_key"] = app.user_key
                app_obj["display_text"] = app.display_text
                app_obj["annoymous"] = app.anonymous
                app_obj["scopes"] = app.scopes
                app_obj["is_readonly_scope"] = app.is_readonly_scope
                apps[client_id] = app_obj
            apps[client_id]["user_emails"].append(email)
    return apps
