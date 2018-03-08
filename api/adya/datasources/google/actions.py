from adya.datasources.google import gutils
from adya.common import errormessage,utils
from adya.db.connection import db_connection
from adya.db import models
from adya.common import constants
from sqlalchemy import and_
from adya.controllers import resourceController
from requests_futures.sessions import FuturesSession

def delete_user_from_group(domain_id, datasource_id, group_email, user_email):
    try:
        directory_service = gutils.get_gdrive_directory_service(domain_id=domain_id)

        if not directory_service:
            print "Didn't get directory service!"
        else:
            print "Initiating removal of user {} from group {} ...".format(user_email, group_email)
            response = directory_service.members().delete(groupKey=group_email, userKey=user_email)
            print response

        return errormessage.ACTION_EXECUTION_SUCCESS


    except Exception as e:
        print e
        print "Exception occurred while removing {} from group {} ".format(user_email, group_email)


def add_user_to_group(domain_id, datasource_id, group_email, user_email, user_type):
    try:
        directory_service = gutils.get_gdrive_directory_service(domain_id=domain_id)

        if not directory_service:
            print "Didn't get directory service!"
        else:
            print "Initiating addition of user {} to group {} ...".format(user_email, group_email)
            response = directory_service.members().insert(groupKey=group_email, userKey=user_email)
            print response

        return errormessage.ACTION_EXECUTION_SUCCESS


    except Exception as e:
        print e
        print "Exception occurred while adding {} to group {} ".format(user_email, group_email)


def get_applicationDataTransfers_for_gdrive(domain_id, datatransfer_service):
    try:

        results = datatransfer_service.applications().list(maxResults=10).execute()
        applications = results.get('applications', [])

        applicationDataTransfers = [{"applicationId": 0, "applicationTransferParams": {}}]
        if not applications:
            print('No applications found.')
        else:
            print('Applications:')
            for application in applications:
                print('{0} ({1})'.format(application['name'], application['id']))
                if application['name'] == 'Drive and Docs':
                    applicationDataTransfers[0]['applicationId'] = application['id']
                    applicationDataTransfers[0]['applicationTransferParams'] = application['transferParams']

        return applicationDataTransfers

    except Exception as e:
        print e
        print "Exception occurred while getting applications for domain: ", domain_id


def transfer_ownership(domain_id, old_owner_email, new_owner_email):
    try:
        datatransfer_service = gutils.get_gdrive_datatransfer_service(domain_id=domain_id)

        if datatransfer_service:
            print "Got datatransfer service!"

        print "Initiating data transfer..."
        applicationDataTransfers = get_applicationDataTransfers_for_gdrive(domain_id, datatransfer_service)

        directory_service = gutils.get_directory_service(domain_id=domain_id)
        old_user_id = directory_service.users().get(userKey=old_owner_email).execute()
        old_user_id = old_user_id.get('id')
        new_user_id = directory_service.users().get(userKey = new_owner_email).execute()
        new_user_id = new_user_id.get('id')


        transfersResource = { "oldOwnerUserId" : old_user_id, "newOwnerUserId": new_user_id,
                              "applicationDataTransfers": applicationDataTransfers}

        response = datatransfer_service.transfers().insert(body=transfersResource).execute()
        print response
        # handle failure in response
        return response

    except Exception as e:
        print e
        print "Exception occurred while transferring ownership from ", old_user_id, " to ", new_user_id, " on domain: ", domain_id


def transfer_ownership_of_resource(domain_id, datasource_id, resource_id, old_owner_email, new_owner_email):
    try:
        print ""
        permission_object = {
            "role": constants.Role.OWNER,
            "type": "user",
            "emailAddress": new_owner_email
        }

        resource_actions_handler = AddOrUpdatePermisssionForResource(domain_id, datasource_id, resource_id, permission_object, old_owner_email)
        response = resource_actions_handler.add_or_update_permission()
        print response


    except Exception as e:
        print e


def remove_external_access_for_all_files_owned_by_user(domain_id, datasource_id, user_email):
    try:
        print ""
        file_list = resourceController.get_all_externally_shared_files_of_user(domain_id, datasource_id, user_email)
        #file_list = resourceController.get_resources(auth_token, user_emails=[user_email])
        print "file_list : " , file_list

        for resource_id in file_list:
            permissions_object_list = file_list[resource_id]

            for permissions_object in permissions_object_list:
                permissions_object['role'] = ""
                print permissions_object

            resource_actions_handler = AddOrUpdatePermisssionForResource(domain_id, datasource_id, resource_id,
                                                                     permissions_object_list, user_email)
            response = resource_actions_handler.add_or_update_permission()
            print response

    except Exception as e:
        print e


def remove_external_access_to_resource(domain_id, datasource_id, resource_id):
    try:
        print ""
        resource_permissions = resourceController.get_external_permissions_for_resource(domain_id, datasource_id, resource_id)

        for resource_id in resource_permissions:
            permissions_object_list = resource_permissions[resource_id]
            resource_owner = permissions_object_list[0]['resource_owner_id']

            for permissions_object in permissions_object_list:
                permissions_object['role'] = ""

            resource_actions_handler = AddOrUpdatePermisssionForResource(domain_id, datasource_id, resource_id,
                                                                         permissions_object_list, resource_owner)
            response = resource_actions_handler.add_or_update_permission()
            print response



    except Exception as e:
        print e


def make_all_files_owned_by_user_private(domain_id, datasource_id, user_email):
    try:
        print ""
        file_list = resourceController.get_all_shared_files_of_user(domain_id, datasource_id, user_email)

        for resource_id in file_list:
            permissions_object_list = file_list[resource_id]

            for permissions_object in permissions_object_list:
                permissions_object['role'] = ""

            resource_actions_handler = AddOrUpdatePermisssionForResource(domain_id, datasource_id, resource_id,
                                                                     permissions_object_list, user_email)
            response = resource_actions_handler.add_or_update_permission()
            print response

    except Exception as e:
        print e


def make_resource_private(domain_id, datasource_id, resource_id):
    try:
        print ""
        resource_permissions = resourceController.get_all_permissions_for_resource(domain_id, datasource_id, resource_id)

        for resource_id in resource_permissions:
            permissions_object_list = resource_permissions[resource_id]
            resource_owner = permissions_object_list[0]['resource_owner_id']

            for permissions_object in permissions_object_list:
                permissions_object['role'] = ""

            resource_actions_handler = AddOrUpdatePermisssionForResource(domain_id, datasource_id, resource_id,
                                                                         permissions_object_list, resource_owner)
            response = resource_actions_handler.add_or_update_permission()
            print response


    except Exception as e:
        print e


def remove_permissions_of_user_to_resource(domain_id, datasource_id, resource_id, user_email, resource_owner_email):
    try:
        print ""

        permission_id = resourceController.get_permission_id_for_user_resource(domain_id, datasource_id, user_email,
                                                                               resource_id)
        print "Got permission_id: {}".format(permission_id)

        permission_object = {
            "permissionId": permission_id,
            "type": "user",
            "emailAddress": user_email
        }

        resource_actions_handler = AddOrUpdatePermisssionForResource(domain_id, datasource_id, resource_id,
                                                                     permission_object, resource_owner_email)
        response = resource_actions_handler.add_or_update_permission()
        print response

    except Exception as e:
        print e


def update_permissions_of_user_to_resource(domain_id, datasource_id, resource_id, user_email, new_permission_role, resource_owner_email):
    try:
        print ""

        permission_id = resourceController.get_permission_id_for_user_resource(domain_id, datasource_id, user_email, resource_id)
        print "Got permission_id: {}".format(permission_id)


        permission_object = {
            "permissionId" : permission_id,
            "role": new_permission_role,
            "type": "user",
            "emailAddress": user_email
        }

        resource_actions_handler = AddOrUpdatePermisssionForResource(domain_id, datasource_id, resource_id,
                                                                     [permission_object], resource_owner_email)
        response = resource_actions_handler.add_or_update_permission()
        print response


    except Exception as e:
        print e

def remove_all_access_for_user(domain_id, datasource_id, user_email):
    try:

        file_perm_list = resourceController.get_all_unowned_files_user_can_access(domain_id, datasource_id, user_email)
        print "file perms list : ", file_perm_list

        for resource_id in file_perm_list:
            permissions_object_list = file_perm_list[resource_id]

            for permissions_object in permissions_object_list:
                permissions_object['role'] = ""
                print permissions_object

            resource_actions_handler = AddOrUpdatePermisssionForResource(domain_id, datasource_id, resource_id,
                                                                     permissions_object_list, user_email)
            response = resource_actions_handler.add_or_update_permission()
            print response

    except Exception as e:
        print e


# This class takes at max 100 resource id and update the permission
# here batch data is an array of resource_id and permissionid/useremail list

class AddOrUpdatePermisssionForResource():

    def __init__(self,domain_id,datasource_id,resource_id,permissison_object_batch_data, owner_email):
        self.resource_id = resource_id
        self.batch_data = permissison_object_batch_data
        self.owner_email = owner_email
        db_session = db_connection().get_session()
        datasource = db_session.query(models.DataSource).filter(and_(models.DataSource.domain_id == domain_id,models.DataSource.datasource_id==datasource_id)).first()
        if datasource.is_serviceaccount_enabled:
            self.drive_service = gutils.get_gdrive_service(domain_id,owner_email)
        else:
            self.drive_service = gutils.get_gdrive_service(domain_id)
        
    def add_or_update_permission(self):
        if len(self.batch_data) == 1:
            permissiondata = self.get_permission_data_object(self.batch_data[0])
            return permissiondata.execute()
        batch_service = self.drive_service.new_batch_http_request(callback=self.add_or_update_permission_callback)
        i =0
        for permission_object in self.batch_data:
            permissiondata = self.get_permission_data_object(permission_object)
            batch_service.add(permissiondata)
            i +=1
            if i==100:
              batch_service.execute()
              i=0 
        if i>0:
            batch_service.execute()
    
    def get_permission_data_object(self,permission_object):
        permission_id = permission_object.get("permissionId")
        role = permission_object.get("role")
        if not permission_id:
            permissiondata = self.add_permisssion_for_resuorce(self.drive_service,self.resource_id, permission_object)
        elif permission_id and role:
            permissiondata = self.change_permisssion_for_resource(self.drive_service, permission_object)
        elif permission_id and (not role):
            permissiondata = self.delete_permisssion_for_resource(self.drive_service,self.resource_id, permission_object)
        return permissiondata

    def add_or_update_permission_callback(self, request_id, response, exception):
        if exception:
            print exception
            session = FuturesSession()
            push_message = {
                "resourceId":self.resource_id,
                "message" : exception.message
            }
            notification =session.post(url=constants.REAL_TIME_URL, json=push_message)
            notification.result()
    

    def add_permisssion_for_resuorce(self,drive_service, permission_object):
        add_permission_object = {
            "role":permission_object.get('role'),
            "type":"group",
            "emailAddress": permission_object.get("emailAddress")
        }
        data = drive_service.permissions().create(fileId=self.resource_id,body = add_permission_object,fields='id')
        return data
 
    def change_permisssion_for_resource(self,drive_service, permission_object):
        permission_id = permission_object.get("permissionId")
        role = permission_object['role']
        user_permission = {
            'role':role,
        }
        print "user_permission: ", user_permission
        if role == constants.Role.OWNER:
            permission_object['role'] = constants.Role.WRITER
            add_permission_response = self.add_permisssion_for_resuorce(self.drive_service,permission_object).execute()
            data = drive_service.permissions().update(fileId=self.resource_id,
                                                       permissionId=add_permission_response['id'],transferOwnership=True,
                                                       body=user_permission,
                                                       fields='id')
        else:
            data = drive_service.permissions().update(fileId=self.resource_id, permissionId =permission_id,
                                                      body = user_permission,fields='id')
        return data

    def delete_permisssion_for_resource(self, drive_service,resource_id,permission_object):
        permission_id = permission_object["permissionId"]
        data = drive_service.permissions().delete(fileId=self.resource_id, permissionId=permission_id)
        return data

