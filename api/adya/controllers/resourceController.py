from adya.db.connection import db_connection
from adya.db.models import Resource,ResourcePermission,LoginUser,DataSource,ResourcePermission
from sqlalchemy import and_
import json
from adya.common import utils
from sets import Set

def get_resource_tree(auth_token, parent_id,emailList=None):
    if not auth_token:
        return None
    db_session = db_connection().get_session()
    domain_id,datasource_id_list_data = utils.get_domain_id_and_datasource_id_list(db_session,auth_token)
    resources_tree ={}
    for datasource in datasource_id_list_data:
        datasource_id = datasource.datasource_id
        resources = []
        if emailList:
            resource_permissions_query_data=None
            if not parent_id:
                resource_permissions_query_data = db_session.query(Resource,ResourcePermission).join(ResourcePermission,
                                        and_(ResourcePermission.resource_id == Resource.resource_id,
                                        ResourcePermission.domain_id == Resource.domain_id)).filter(and_(Resource.domain_id == domain_id,
                                        Resource.resource_type =='folder',
                                        ResourcePermission.email.in_(emailList))).all()
            else:
                resource_permissions_query_data = db_session.query(Resource,ResourcePermission).join(ResourcePermission,
                                        and_(ResourcePermission.resource_id == Resource.resource_id,
                                        ResourcePermission.domain_id == Resource.domain_id)).filter(and_(Resource.domain_id == domain_id,
                                        ResourcePermission.email.in_(emailList),Resource.resource_parent_id == parent_id)).all()
            resource_id_set = Set()
            for row in resource_permissions_query_data:
                resource_id_set.add(row.Resource.resource_id)
            resource_data =[]
            for row in resource_permissions_query_data:
                if (row.Resource.resource_parent_id != None and not row.Resource.resource_parent_id in resource_id_set) \
                    or row.Resource.resource_parent_id == None :
                    resources.append(row)
        else:
            if not parent_id:
                resources = db_session.query(Resource,ResourcePermission).join(ResourcePermission,
                                    and_(ResourcePermission.resource_id == Resource.resource_id,
                                    ResourcePermission.domain_id == Resource.domain_id)).filter(and_(Resource.domain_id == domain_id, 
                                    Resource.resource_type =='folder',Resource.resource_parent_id == parent_id)).all()
            else:
                resources = db_session.query(Resource,ResourcePermission).join(ResourcePermission,
                                    and_(ResourcePermission.resource_id == Resource.resource_id,
                                    ResourcePermission.domain_id == Resource.domain_id)).filter(and_(Resource.domain_id == domain_id, 
                                    Resource.resource_parent_id == parent_id)).all()
        
        responsedata ={}
        for resource in resources:
            permissionobject = {
                                    "permissionId":resource.ResourcePermission.permission_id,
                                    "pemrissionEmail":resource.ResourcePermission.email,
                                    "permissionType":resource.ResourcePermission.permission_type
                               }

            if not resource.Resource.resource_id in responsedata:
                responsedata[resource.Resource.resource_id] = {
                    "resourceName":resource.Resource.resource_name,
                    "resourceType":resource.Resource.resource_type,
                    "resourceOwnerId":resource.Resource.resource_owner_id,
                    "exposureType":resource.Resource.exposure_type,
                    "permissions":[permissionobject]
                }
            else:
                responsedata[resource.Resource.resource_id]["permissions"].append(permissionobject)
        resources_tree[datasource_id] = responsedata
    return resources_tree



