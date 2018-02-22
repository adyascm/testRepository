from adya.datasources.google import gutils
from adya.db.connection import db_connection
from adya.db.models import Resource,ResourceParent,DomainUser,DataSource
from adya.common import constants
from sqlalchemy import and_
#  this class is use to get permisson for drive resources


class GetParents():
    domain_id =""

    def __init__(self, domain_id, datasource_id, resources,user_email):
        self.domain_id = domain_id
        self.datasource_id = datasource_id
        self.resources = resources
        self.resource_count = len(resources)
        self.user_email = user_email
        self.resource_parent_array = []
    # callback will be called for each fileId, here request_id will be in same order we have created the request
    ## here I am not considering case of more than 100 permissions for a given file id
    ## we need to implement that in future if we get that use case.
    def resource_parentscallback(self,request_id, response, exception):

            if exception:
                print exception
            else:
                request_id = int(request_id)
                resource_id = self.resources[request_id - 1]
                if response:
                    row = {"resourceId":resource_id}
                    if response.get('parents'):
                        row["parentId"] = response['parents'][0]
                    else:
                        mime_type = gutils.get_file_type_from_mimetype(response['mimeType'])
                        if mime_type != 'folder':
                            row["parentId"] = constants.ROOT
                    self.resource_parent_array.append(row)
                if self.resource_count == request_id:
                    self.update_parents_data_for_resource()

    # getting permissison for 100 resourceId
    def get_parent(self):
        drive_service = gutils.get_gdrive_service(self.domain_id,self.user_email)
        batch = drive_service.new_batch_http_request(callback=self.resource_parentscallback)
        quotauser = None if not self.user_email else self.user_email[0:41]
        for resource in self.resources:
            permisssion_data_object = drive_service.files().\
                                        get(fileId=resource,
                                           fields="id, mimeType, parents",quotaUser=quotauser)
            batch.add(permisssion_data_object)
        batch.execute()

    ## by default we have assign PRIVATE permisssion for each resource,because while getting resouce information we are not
    ## getting permission for resource,
    ## Now we got the permission for each resource we can update the permission
    ## this method will be called if the resource has been shared with atleast one people
    ## because in that case only we will get permission for the given resource
    def update_parents_data_for_resource(self):
        data_for_parent_table =[]
        db_session = db_connection().get_session()
        email = self.user_email
        if not email:
            email = self.domain_id
        for resource_parent_data in self.resource_parent_array:
            resource_parent = {}
            resource_parent['domain_id'] = self.domain_id
            resource_parent['datasource_id'] = self.datasource_id
            resource_parent['email'] = email
            resource_parent['resource_id'] = resource_parent_data['resourceId']
            resource_parent['parent_id'] = resource_parent_data.get('parentId')
            data_for_parent_table.append(resource_parent)
        try:
            db_session.bulk_insert_mappings(ResourceParent, data_for_parent_table)
            db_session.commit()
            print "Inserted parent data into db"
        except Exception as ex:
            print (ex)
            print("Updating parents for failed")