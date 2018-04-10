from adya.db.models import DirectoryStructure, LoginUser, DataSource, DomainUser, DomainGroup, Application, \
    ApplicationUserAssociation, Resource, ResourcePermission
from adya.db.connection import db_connection
from sqlalchemy import and_, desc, asc
import json
from adya.common import utils, constants
from adya.datasources.google import gutils
from adya.controllers import common

def get_user_group_tree(auth_token):
    db_session = db_connection().get_session()
    existing_user = common.get_user_session(auth_token)
    user_domain_id = existing_user.domain_id
    login_user_email = existing_user.email
    is_admin = existing_user.is_admin
    is_service_account_is_enabled = existing_user.is_serviceaccount_enabled
    
    datasource_id_list_data = db_session.query(DataSource.datasource_id).filter(
        DataSource.domain_id == user_domain_id).all()

    users_groups = {}
    for datasource in datasource_id_list_data:
        datasource_id = datasource.datasource_id

        if is_service_account_is_enabled and not is_admin:
                extUsers = db_session.query(DomainUser).filter(and_(Resource.resource_owner_id == login_user_email,
                               ResourcePermission.resource_id == Resource.resource_id,
                               ResourcePermission.email == DomainUser.email,
                               ResourcePermission.datasource_id == datasource_id)).all()

                for extusr in extUsers :
                    extusr.parents = []
                    users_groups[extusr.email] =extusr

                usersData = db_session.query(DomainUser) \
                                .filter(and_(DomainUser.datasource_id == datasource_id, DomainUser.email == existing_user.email)).all()
                usersData[0].parents = []
                users_groups[usersData[0].email] = usersData[0]

                groupsData = db_session.query(DomainGroup).filter(DomainGroup.datasource_id == datasource_id).filter(
                    LoginUser.auth_token == auth_token).filter(
                    DirectoryStructure.datasource_id == DomainGroup.datasource_id,
                    DirectoryStructure.member_email == login_user_email,
                    DirectoryStructure.parent_email == DomainGroup.email).all()

                if len(groupsData) > 1:
                    for groupdata in groupsData:
                        groupdata.parents = []
                        groupdata.children = []
                        users_groups[groupdata.email] = groupdata
                elif len(groupsData) > 0:
                        groupsData[0].parents = []
                        groupsData[0].children = []
                        users_groups[groupsData[0].email] = groupsData[0]
        else:
            getUsersData(users_groups, db_session, domain_id=user_domain_id, datasource_id=datasource_id)
            getGroupData(users_groups, db_session, domain_id=user_domain_id, datasource_id=datasource_id)

        parent_child_data_array = db_session.query(DirectoryStructure.parent_email, DirectoryStructure.member_email) \
            .filter(DirectoryStructure.datasource_id == datasource_id).all()

        for parent_child_data in parent_child_data_array:
            parent_email = parent_child_data.parent_email
            child_email = parent_child_data.member_email
            if child_email in users_groups:
                users_groups[child_email].parents.append(parent_email)
                if parent_email in users_groups:
                    users_groups[parent_email].children.append(child_email)
                # userGrouptrees[datasource_id] = users_groups
    return users_groups


def getUsersData(users_groups, db_session, domain_id, datasource_id):
    usersData = db_session.query(DomainUser) \
        .filter(and_(DomainUser.datasource_id == datasource_id)).order_by(asc(DomainUser.first_name)).all()
    for userdata in usersData:
        userdata.parents = []
        users_groups[userdata.email] = userdata


def getGroupData(users_groups, db_session, domain_id, datasource_id):
    groupsData = db_session.query(DomainGroup) \
        .filter(DomainGroup.datasource_id == datasource_id).all()
    for groupdata in groupsData:
        groupdata.parents = []
        groupdata.children = []
        users_groups[groupdata.email] = groupdata


def get_all_apps(auth_token):
    db_session = db_connection().get_session()
    domain_data = db_session.query(DomainUser, DataSource.datasource_id).filter(
        DataSource.domain_id == LoginUser.domain_id). \
        filter(LoginUser.auth_token == auth_token, LoginUser.email == DomainUser.email).all()

    is_admin = domain_data[0].DomainUser.is_admin
    login_user_email = domain_data[0].DomainUser.email
    domain_datasource_ids = [r[1] for r in domain_data]

    apps_query_data = db_session.query(Application).filter(Application.datasource_id.in_(domain_datasource_ids))
    if not is_admin:
        apps_query_data = apps_query_data.filter(Application.client_id == ApplicationUserAssociation.client_id,
                                               ApplicationUserAssociation.datasource_id == Application.datasource_id,
                                               ApplicationUserAssociation.user_email == login_user_email)
    apps_data = apps_query_data.order_by(desc(Application.score)).all()
    return apps_data


def get_users_for_app(auth_token, client_id):
    db_session = db_connection().get_session()

    # check for non-admin user
    existing_user = common.get_user_session(auth_token)
    is_admin = existing_user.is_admin
    is_service_account_is_enabled = existing_user.is_serviceaccount_enabled
    login_user_email = existing_user.email

    domain_datasource_ids = db_session.query(DataSource.datasource_id).filter(
        DataSource.domain_id == LoginUser.domain_id). \
        filter(LoginUser.auth_token == auth_token).all()

    domain_datasource_ids = [r for r, in domain_datasource_ids]

    # if servie account and non-admin user, show permission for logged in user only
    if is_service_account_is_enabled and not is_admin:
        domain_user_emails = [[login_user_email]]

    else:
        domain_user_emails = db_session.query(ApplicationUserAssociation.user_email).filter(
            and_(ApplicationUserAssociation.client_id == client_id,
                 ApplicationUserAssociation.datasource_id.in_(domain_datasource_ids))).all()

    domain_user_emails = [r for r, in domain_user_emails]

    apps_query_data = db_session.query(DomainUser).filter(and_(DomainUser.email.in_(domain_user_emails),
                                                               DomainUser.datasource_id.in_(
                                                                   domain_datasource_ids))).all()
    return apps_query_data


def get_apps_for_user(auth_token, user_email):
    db_session = db_connection().get_session()
    domain_datasource_ids = db_session.query(DataSource.datasource_id).filter(
        DataSource.domain_id == LoginUser.domain_id). \
        filter(LoginUser.auth_token == auth_token).all()
    domain_datasource_ids = [r for r, in domain_datasource_ids]
    domain_applications = db_session.query(ApplicationUserAssociation.client_id).filter(
        and_(ApplicationUserAssociation.user_email == user_email,
             ApplicationUserAssociation.datasource_id.in_(domain_datasource_ids))).all()
    domain_applications = [r for r, in domain_applications]
    user_apps = db_session.query(Application).filter(and_(Application.client_id.in_(domain_applications),
                                                          Application.datasource_id.in_(domain_datasource_ids))).order_by(desc(Application.score)).all()
    return user_apps
