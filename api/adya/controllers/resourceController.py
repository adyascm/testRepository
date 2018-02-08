from adya.db.connection import db_connection
from adya.db.models import Resource,ResourcePermission,LoginUser,DataSource,ResourcePermission
from sqlalchemy import and_
import json
from adya.common import utils

def get_resource_tree(auth_token, parent_id):
    if not auth_token:
        return None
    db_session = db_connection().get_session()
    existing_user = db_session.query(LoginUser).filter(LoginUser.auth_token == auth_token).first()
    domain_id = existing_user.domain_id
    datasource_id_list_data = db_session.query(DataSource.datasource_id).filter(DataSource.domain_id == domain_id).all()

    resources_tree ={}
    for datasource in datasource_id_list_data:
        datasource_id = datasource.datasource_id
        resources,resource_id_array = get_resource(db_session,domain_id,datasource_id,parent_id)
        query =  db_session.query(ResourcePermission).filter( and_(ResourcePermission.domain_id == domain_id,
                                                  Resource.resource_id.in_(resource_id_array)))
        permissions_query_data = db_session.query(ResourcePermission).filter( and_(ResourcePermission.domain_id == domain_id,
                                                  ResourcePermission.resource_id.in_(resource_id_array))).all()
        
        for permission in permissions_query_data:
            permissionobject = {"permissionId":permission.permission_id,"pemrissionEmail":permission.email,"permissionType":permission.permission_type}
            resources[permission.resource_id]["permissions"].append(permissionobject)
        resources_tree[datasource_id] = resources
    return utils.get_response_json(resources_tree)

def get_resource(db_session,domain_id,datasource_id,parent_id):
    resources ={}
    resources_querydata = db_session.query(Resource).filter( and_(Resource.domain_id == domain_id,
                                                                Resource.datasource_id == datasource_id,
                                                                Resource.resource_parent_id == parent_id)).all()
    resource_id_array =[]
    for resource in resources_querydata:
        resources[resource.resource_id] = {"resourceName":resource.resource_name,"resourceType":resource.resource_type,
                                           "resourceOwnerId":resource.resource_owner_id,"exposureType":resource.exposure_type,"permissions":[]}
        resource_id_array.append(resource.resource_id)
    return resources,resource_id_array




