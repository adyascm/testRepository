from adya.datasources.google import gutils
from adya.db.connection import db_connection
from adya.db.models import Resource,ResourcePermission
from adya.common import constants
from sqlalchemy import and_
#  this class is use to get permisson for drive resources


class GetPermission():
    domain_id =""

    def __init__(self, domain_id,resources):
        self.domain_id = domain_id
        self.resources = resources
    # callback will be called for each fileId, here request_id will be in same order we have created the request
    ## here I am not considering case of more than 100 permissions for a given file id
    ## we need to implement that in future if we get that use case.
    def resource_permissioncallback(self,request_id, response, exception):
            resource_id = self.resources[int(request_id) - 1]
            if response:
                self.update_permission_data_for_resource(resource_id,response)

    # getting permissison for 100 resourceId
    def get_permission(self):
        drive_service = gutils.get_gdrive_service()
        batch = drive_service.new_batch_http_request(callback=self.resource_permissioncallback)

        for resource in self.resources:
            permisssion_data_object = drive_service.permissions().\
                                        list(fileId=resource,
                                           fields="permissions(id, emailAddress, role, displayName), nextPageToken",
                                            pageSize=100,pageToken = None)
            batch.add(permisssion_data_object)
        batch.execute()

    ## by default we have assign PRIVATE permisssion for each resource,because while getting resouce information we are not
    ## getting permission for resource,
    ## Now we got the permission for each resource we can update the permission
    ## this method will be called if the resource has been shared with atleast one people
    ## because in that case only we will get permission for the given resource
    def update_permission_data_for_resource(self,resource_id,permissions):
        data_for_permission_table =[]
        resource = Resource()
        resource.domain_id = self.domain_id
        resource.resource_id = resource_id
        resource_exposure_type = constants.ResourceExposureType.PRIVATE
        db_session = db_connection().get_session()
        resource_permission ={}
        for permission in permissions:
            permission_type = constants.PermissionType.READ
            permission_id = permissions.get('id')
            role = permission['role']
            if role == "owner" or role == "writer":
                permission_type = constants.PermissionType.WRITE
            email_address = permission.get('emailAddress')
            display_name = permissions.get('displayName')
            if email_address:
                resource_exposure_type = constants.ResourceExposureType.INTERNAL
                if gutils.get_domain_name_from_email(email_address) != self.domain_id:
                    resource_exposure_type = constants.ResourceExposureType.EXTERNAL
            elif display_name:
                resource_exposure_type = constants.ResourceExposureType.DOMAIN
                email_address = "__ANYONE__@"+ self.domain_id
            else:
                resource_exposure_type = constants.ResourceExposureType.PUBLIC
                email_address = constants.ResourceExposureType.PUBLIC
            resource_permission['domain_id'] = self.domain_id
            resource_permission['resource_id'] = resource_id
            resource_permission['email'] = email_address
            resource_permission['permission_id'] = permission_id
            resource_permission['permission_type'] = permission_type
            data_for_permission_table.append(resource_permission)

        db_session.bulk_insert_mappings(ResourcePermission, data_for_permission_table)
        db_session.query(Resource).filter(and_(Resource.resource_id == resource_id, Resource.domain_id== self.domain_id))\
            .update({'exposure_type': resource_exposure_type})
        db_session.commit()
