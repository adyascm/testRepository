from adya.db.models import DirectoryStructure, LoginUser, DataSource, DomainUser, DomainGroup
from adya.db.connection import db_connection
from sqlalchemy import and_


def get_user_group_tree(auth_token):

    db_session = db_connection().get_session()
    existing_user = db_session.query(LoginUser).filter(LoginUser.auth_token == auth_token).first()
    user_domain_id = existing_user.domain_id
    datasource_id_list_data = db_session.query(DataSource.datasource_id).filter(DataSource.domain_id == user_domain_id).all()

    userGrouptrees ={}

    for datasource in datasource_id_list_data:
        datasource_id = datasource.datasource_id        
        users = getUsersData(db_session, domain_id=user_domain_id, datasource_id= datasource_id)
        groups = getGroupData(db_session, domain_id=user_domain_id, datasource_id= datasource_id)
        
        parent_child_data_array = db_session.query(DirectoryStructure.parent_email,DirectoryStructure.member_email)\
            .filter(and_(DirectoryStructure.domain_id == user_domain_id,DirectoryStructure.datasource_id == datasource_id)).all()
        
        for parent_child_data in parent_child_data_array:
            parent_email = parent_child_data.parent_email
            child_email = parent_child_data.member_email
            if child_email in users:
                users[child_email]["parents"].append(parent_email)
            elif child_email in groups:
                groups[parent_email]["children"].append(child_email)
                groups[child_email]["parents"].append(parent_email)
        userGroupdata ={}
        userGroupdata['users'] = users
        userGroupdata['groups'] = groups
        userGrouptrees[datasource_id] = userGroupdata
    return userGrouptrees


def getUsersData(db_session, domain_id, datasource_id):

    users ={}

    usersData = db_session.query(DomainUser)\
            .filter(and_(DomainUser.domain_id == domain_id,DomainUser.datasource_id == datasource_id)).all()
    for userdata in usersData:
        users[userdata.email] ={"firstName":userdata.first_name,"lastName":userdata.last_name,"member_type":userdata.member_type,"parents":[]}
    return users


def getGroupData(db_session, domain_id, datasource_id):
    groups = {}

    groupsData = db_session.query(DomainGroup) \
        .filter(and_(DomainGroup.domain_id == domain_id, DomainGroup.datasource_id == datasource_id)).all()
    for groupdata in groupsData:
        groups[groupdata.email] = {"name": groupdata.name, "includeAllUsers": groupdata.include_all_user,
                                   "parents": [], "children": []}
    return groups