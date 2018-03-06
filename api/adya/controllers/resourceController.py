from adya.db.connection import db_connection
from adya.db.models import Resource,ResourcePermission,LoginUser,DataSource,ResourcePermission,ResourceParent,Domain, DomainUser
from sqlalchemy import and_, desc, or_
from sqlalchemy.orm import aliased
from adya.common import constants

# def get_resource_tree(auth_token, parent_id,emailList=None):
#     if not auth_token:
#         return None
#     db_session = db_connection().get_session()
#     domain_id,datasource_id_list_data = utils.get_domain_id_and_datasource_id_list(db_session,auth_token)
#     resources_tree ={}
#     resources = []
#     for datasource in datasource_id_list_data:
#         datasource_id = datasource.datasource_id

#         if emailList:
#             resource_permissions_query_data=None
#             if not parent_id:
#                 resource_permissions_query_data = db_session.query(Resource,ResourcePermission).outerjoin(ResourcePermission,
#                                         and_(ResourcePermission.resource_id == Resource.resource_id,
#                                         ResourcePermission.domain_id == Resource.domain_id)).filter(and_(Resource.domain_id == domain_id,
#                                         Resource.resource_type =='folder',
#                                         ResourcePermission.email.in_(emailList))).all()
#             else:
#                 resource_permissions_query_data = db_session.query(Resource,ResourcePermission).outerjoin(ResourcePermission,
#                                         and_(ResourcePermission.resource_id == Resource.resource_id,
#                                         ResourcePermission.domain_id == Resource.domain_id)).filter(and_(Resource.domain_id == domain_id,
#                                         ResourcePermission.email.in_(emailList),Resource.resource_parent_id == parent_id)).all()
#             resource_id_set = Set()
#             for row in resource_permissions_query_data:
#                 resource_id_set.add(row.Resource.resource_id)
#             resource_data =[]
#             for row in resource_permissions_query_data:
#                 if (row.Resource.resource_parent_id != None and not row.Resource.resource_parent_id in resource_id_set) \
#                     or row.Resource.resource_parent_id == None :
#                     resources.append(row)
#         else:
#             if not parent_id:
#                 resources = db_session.query(Resource,ResourcePermission).outerjoin(ResourcePermission,
#                                     and_(ResourcePermission.resource_id == Resource.resource_id,
#                                     ResourcePermission.domain_id == Resource.domain_id)).filter(and_(Resource.domain_id == domain_id,
#                                     Resource.resource_type =='folder',Resource.resource_parent_id == parent_id)).all()
#             else:
#                 resources = db_session.query(Resource,ResourcePermission).outerjoin(ResourcePermission,
#                                     and_(ResourcePermission.resource_id == Resource.resource_id,
#                                     ResourcePermission.domain_id == Resource.domain_id)).filter(and_(Resource.domain_id == domain_id,
#                                     Resource.resource_parent_id == parent_id)).all()

#     responsedata ={}
#     for resource in resources:
#         if resource.ResourcePermission:
#             permissionobject = {
#                                     "permissionId":resource.ResourcePermission.permission_id,
#                                     "pemrissionEmail":resource.ResourcePermission.email,
#                                     "permissionType":resource.ResourcePermission.permission_type
#                             }
#         else:
#             permissionobject ={}

#         if not resource.Resource.resource_id in responsedata:
#             responsedata[resource.Resource.resource_id] = {
#                 "resourceId":resource.Resource.resource_id,
#                 "resourceName":resource.Resource.resource_name,
#                 "resourceType":resource.Resource.resource_type,
#                 "resourceOwnerId":resource.Resource.resource_owner_id,
#                 "exposureType":resource.Resource.exposure_type,
#                 "permissions":[permissionobject]
#             }
#         else:
#             responsedata[resource.Resource.resource_id]["permissions"].append(permissionobject)
#     resources_tree[datasource_id] = responsedata
#     return responsedata


def get_resources(auth_token, page_number, page_limit, user_emails=None, exposure_type='EXT', resource_type='None', prefix=''):
    if not auth_token:
        return None
    page_number = page_number if page_number else 0
    page_limit = page_limit if page_limit else constants.PAGE_LIMIT

    db_session = db_connection().get_session()
    domain = db_session.query(Domain).filter(LoginUser.domain_id == Domain.domain_id). \
        filter(LoginUser.auth_token == auth_token).first()
    resources = []
    resource_alias = aliased(Resource)
    parent_alias = aliased(Resource)
    resources_query = db_session.query(resource_alias, parent_alias.resource_name).outerjoin(parent_alias, resource_alias.parent_id == parent_alias.resource_id)
    if user_emails:
        resource_ids = db_session.query(ResourcePermission.resource_id).filter(and_(ResourcePermission.domain_id == domain.domain_id, ResourcePermission.email.in_(user_emails)))
        resources_query = resources_query.filter(resource_alias.resource_id.in_(resource_ids))

    if resource_type:
        resources_query = resources_query.filter(resource_alias.resource_type == resource_type)
    if exposure_type:
        resources_query = resources_query.filter(resource_alias.exposure_type == exposure_type)
    if prefix:
        page_limit = 10
        resources_query = resources_query.filter(resource_alias.resource_name.ilike("%" + prefix + "%"))

    resources = resources_query.filter(resource_alias.domain_id == domain.domain_id).order_by(desc(resource_alias.last_modified_time)).offset(page_number * page_limit).limit(page_limit).all()
    result = []
    for resource in resources:
        resource[0].parent_name = resource.resource_name
        result.append(resource[0])
    return result


def search_resources(auth_token, prefix):
    if not auth_token:
        return None
    if not prefix:
        return []
    db_session = db_connection().get_session()
    resources = db_session.query(Resource).filter(and_(Resource.domain_id == LoginUser.domain_id, Resource.resource_name.ilike("%" + prefix + "%"))).filter(LoginUser.auth_token == auth_token).limit(10).all()

    return resources



def get_all_shared_files_of_user(domain_id, datasource_id, user_email):
    try:
        print "Getting all owned files of user {} on domain {} and datasource {}".format(user_email, domain_id, datasource_id)
        db_session = db_connection().get_session()

        resource_filter = and_(Resource.domain_id == domain_id,
                               Resource.datasource_id == datasource_id,
                               Resource.resource_owner_id == user_email,
                               or_(Resource.exposure_type == constants.ResourceExposureType.EXTERNAL,
                               Resource.exposure_type == constants.ResourceExposureType.PUBLIC,
                               Resource.exposure_type == constants.ResourceExposureType.DOMAIN))

        resources_object_list = db_session.query(Resource, ResourcePermission).filter(resource_filter)\
                            .outerjoin(ResourcePermission,
                                       and_(ResourcePermission.resource_id == Resource.resource_id,
                                            ResourcePermission.domain_id == Resource.domain_id,
                                            ResourcePermission.datasource_id == Resource.datasource_id)).all()

        response_data = {}
        for resource in resources_object_list:
            if resource.ResourcePermission:
                if resource.ResourcePermission.email != resource.Resource.resource_owner_id:
                    permissions_object = {
                        "permissionId": resource.ResourcePermission.permission_id,
                        "emailAddress": resource.ResourcePermission.email,
                        "role": resource.ResourcePermission.permission_type
                    }
                    if resource.Resource.resource_id not in response_data:
                        response_data[resource.Resource.resource_id] = []

                    response_data[resource.Resource.resource_id].append(permissions_object)
        print("response data ", response_data)
        return response_data


    except Exception as e:
        print e
        print "Exception occurred getting all shared files of user {} on domain {} and datasource {}".format(user_email, domain_id, datasource_id)


def get_all_externally_shared_files_of_user(domain_id, datasource_id, user_email):
    try:
        print "Getting all externally shared files of user {} on domain {} and datasource {}".format(user_email, domain_id,
                                                                                          datasource_id)
        db_session = db_connection().get_session()

        resource_filter = and_(Resource.domain_id == domain_id,
                               Resource.datasource_id == datasource_id,
                               Resource.resource_owner_id == user_email,
                               Resource.exposure_type == constants.ResourceExposureType.EXTERNAL)

        resources_object_list = db_session.query(Resource, ResourcePermission).filter(resource_filter) \
                       .outerjoin(ResourcePermission,
                                       and_(ResourcePermission.resource_id == Resource.resource_id,
                                            ResourcePermission.domain_id == Resource.domain_id,
                                            ResourcePermission.datasource_id == Resource.datasource_id))\
                       .join(DomainUser, and_(DomainUser.domain_id == ResourcePermission.domain_id,
                                              DomainUser.datasource_id == ResourcePermission.datasource_id,
                                              DomainUser.email == ResourcePermission.email,
                                          DomainUser.member_type == constants.UserMemberType.EXTERNAL)).all()

        response_data =  { }
        for resource in resources_object_list:
            if resource.ResourcePermission:
                permissions_object = {
                    "permissionId": resource.ResourcePermission.permission_id,
                    "emailAddress": resource.ResourcePermission.email,
                    "role": resource.ResourcePermission.permission_type
                }
                if resource.Resource.resource_id not in response_data:
                    response_data[resource.Resource.resource_id] = []

                response_data[resource.Resource.resource_id].append(permissions_object)

        return response_data

    except Exception as e:
        print e
        print "Exception occurred getting all shared files of user {} on domain {} and datasource {}".format(user_email,
                                                                                                             domain_id,
                                                                                                             datasource_id)

def get_external_permissions_for_resource(domain_id, datasource_id, resource_id):
    try:
        print "Getting all external permissions of resource {} on domain {} and datasource {}".format(resource_id,
                                                                                                     domain_id,
                                                                                                     datasource_id)
        db_session = db_connection().get_session()

        resource_filter = and_(Resource.domain_id == domain_id,
                               Resource.datasource_id == datasource_id,
                               Resource.resource_id == resource_id)

        resources_object_list = db_session.query(Resource, ResourcePermission).filter(resource_filter) \
            .outerjoin(ResourcePermission,
                       and_(ResourcePermission.resource_id == Resource.resource_id,
                            ResourcePermission.domain_id == Resource.domain_id,
                            ResourcePermission.datasource_id == Resource.datasource_id)) \
            .join(DomainUser, and_(DomainUser.domain_id == ResourcePermission.domain_id,
                                DomainUser.datasource_id == ResourcePermission.datasource_id,
                                DomainUser.email == ResourcePermission.email,
                               DomainUser.member_type == constants.UserMemberType.EXTERNAL)).all()

        response_data = {}
        for resource in resources_object_list:
            if resource.ResourcePermission:
                permissions_object = {
                    "resource_owner_id": resource.Resource.resource_owner_id,
                    "permissionId": resource.ResourcePermission.permission_id,
                    "emailAddress": resource.ResourcePermission.email,
                    "role": resource.ResourcePermission.permission_type
                }
                if resource.Resource.resource_id not in response_data:
                    response_data[resource.Resource.resource_id] = []

                response_data[resource.Resource.resource_id].append(permissions_object)

        return response_data

    except Exception as e:
        print e
        print "Exception occurred all external permissions of resource {} on domain {} and datasource {}".format(resource_id,
                                                                                                                domain_id,
                                                                                                                 datasource_id)


def get_all_permissions_for_resource(domain_id, datasource_id, resource_id):
    try:
        print "Getting all permissions for resource {} on domain {} and datasource {}".format(resource_id, domain_id, datasource_id)
        db_session = db_connection().get_session()

        resource_filter = and_(Resource.domain_id == domain_id,
                               Resource.datasource_id == datasource_id,
                               Resource.resource_id == resource_id)

        resources_object_list = db_session.query(Resource, ResourcePermission).filter(resource_filter)\
                            .outerjoin(ResourcePermission,
                                       and_(ResourcePermission.resource_id == Resource.resource_id,
                                            ResourcePermission.domain_id == Resource.domain_id,
                                            ResourcePermission.datasource_id == Resource.datasource_id)).all()

        response_data = {}
        for resource in resources_object_list:
            if resource.ResourcePermission:
                if resource.ResourcePermission.email != resource.Resource.resource_owner_id:
                    permissions_object = {
                        "resource_owner_id": resource.Resource.resource_owner_id,
                        "permissionId": resource.ResourcePermission.permission_id,
                        "emailAddress": resource.ResourcePermission.email,
                        "role": resource.ResourcePermission.permission_type
                    }
                    if resource.Resource.resource_id not in response_data:
                        response_data[resource.Resource.resource_id] = []

                    response_data[resource.Resource.resource_id].append(permissions_object)

        return response_data

    except Exception as e:
        print e
        print "Exception occurred getting all permissions for resource {} on domain {} and datasource {}".format(resource_id, domain_id, datasource_id)


def get_permission_id_for_user_resource(domain_id, datasource_id, user_email, resource_id):
    try:
        print "Getting permission_id for user {}, resource {} on domain {} and datasource {}".format(user_email, resource_id, domain_id,
                                                                                              datasource_id)
        db_session = db_connection().get_session()


        permission_id = db_session.query(ResourcePermission).filter(
                       and_(ResourcePermission.resource_id == resource_id,
                            ResourcePermission.domain_id == domain_id,
                            ResourcePermission.datasource_id == datasource_id,
                            ResourcePermission.email == user_email)).first().permission_id

        return permission_id

    except Exception as e:
        print e
        print "Exception occurred getting permission_id for user {}, resource {} on domain {} and datasource {}".format(user_email, resource_id, domain_id,
                                                                                              datasource_id)


def get_all_unowned_files_user_can_access(domain_id, datasource_id, user_email):

    try:

        db_session = db_connection().get_session()

        file_obj = db_session.query(ResourcePermission).filter(and_(ResourcePermission.domain_id == domain_id, ResourcePermission.datasource_id ==
                                                                 datasource_id, ResourcePermission.email == user_email,
                                                                 ResourcePermission.permission_type != "owner")).all()

        print file_obj

        response_data = {}
        for resource in file_obj:
            permissions_object = {
                "permissionId": resource.permission_id,
                "emailAddress": resource.email,
                "role": resource.permission_type
            }

            response_data[resource.resource_id].append(permissions_object)

        print("get_all_unowned_files_user_can_access : response data " ,response_data)
        return response_data
    except Exception as e:
        print e
        print "Exception occured for user {} on domain {} and datasource {}".format(user_email, domain_id, datasource_id)

