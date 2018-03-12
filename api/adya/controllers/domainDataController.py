from adya.db.models import DirectoryStructure, LoginUser, DataSource, DomainUser, DomainGroup,Application,ApplicationUserAssociation
from adya.db.connection import db_connection
from sqlalchemy import and_
import json
from adya.common import utils
from adya.datasources.google import gutils

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
            .filter(DirectoryStructure.datasource_id == datasource_id).all()
        
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
            .filter(DomainUser.datasource_id == datasource_id).all()
    for userdata in usersData:
        userdata.parents = []
        users_groups[userdata.email] = userdata


def getGroupData(users_groups,db_session, domain_id, datasource_id):
    groupsData = db_session.query(DomainGroup) \
        .filter(DomainGroup.datasource_id == datasource_id).all()
    for groupdata in groupsData:
        groupdata.parents = []
        groupdata.children = []
        users_groups[groupdata.email] = groupdata


def get_all_apps(auth_token):
    db_session = db_connection().get_session()
    domain_datasource_ids = db_session.query(DataSource.datasource_id).filter(DataSource.domain_id == LoginUser.domain_id). \
        filter(LoginUser.auth_token == auth_token).all()
    domain_datasource_ids = [r for r, in domain_datasource_ids]
    apps_query_data = db_session.query(Application).filter(Application.datasource_id.in_(domain_datasource_ids)).all()
    return apps_query_data


def get_users_for_app(auth_token,client_id):
    db_session = db_connection().get_session()
    domain_datasource_ids = db_session.query(DataSource.datasource_id).filter(DataSource.domain_id == LoginUser.domain_id). \
        filter(LoginUser.auth_token == auth_token).all()
    domain_datasource_ids = [r for r, in domain_datasource_ids]
    domain_user_emails = db_session.query(ApplicationUserAssociation.user_email).filter(and_(ApplicationUserAssociation.client_id == client_id,
                                         ApplicationUserAssociation.datasource_id.in_(domain_datasource_ids))).all()
    domain_user_emails = [r for r, in domain_user_emails]
    apps_query_data = db_session.query(DomainUser).filter(and_(DomainUser.email.in_(domain_user_emails),
                                         DomainUser.datasource_id.in_(domain_datasource_ids))).all()
    return apps_query_data

def get_apps_for_user(auth_token,user_email):
    db_session = db_connection().get_session()
    domain_datasource_ids = db_session.query(DataSource.datasource_id).filter(DataSource.domain_id == LoginUser.domain_id). \
        filter(LoginUser.auth_token == auth_token).all()
    domain_datasource_ids = [r for r, in domain_datasource_ids]
    domain_applications = db_session.query(ApplicationUserAssociation.client_id).filter(and_(ApplicationUserAssociation.user_email == user_email,
                                         ApplicationUserAssociation.datasource_id.in_(domain_datasource_ids))).all()
    domain_applications = [r for r, in domain_applications]
    user_apps = db_session.query(Application).filter(and_(Application.client_id.in_(domain_applications),
                                         Application.datasource_id.in_(domain_datasource_ids))).all()
    return user_apps
