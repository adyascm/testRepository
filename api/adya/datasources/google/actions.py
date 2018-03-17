from adya.datasources.google import gutils
from adya.common import utils, response_messages
from adya.common import constants
from sqlalchemy import and_
from requests_futures.sessions import FuturesSession
import json


def delete_user_from_group(auth_token, group_email, user_email):
    directory_service = gutils.get_directory_service(auth_token)
    print "Initiating removal of user {} from group {} ...".format(user_email, group_email)
    try:
        response = directory_service.members().delete(groupKey=group_email, memberKey=user_email).execute()
        return response
        # return response_messages.ResponseMessage(200, "Action completed successfully")
    except Exception as ex:
        content = json.loads(ex.content)
        return content
        # return response_messages.ResponseMessage(ex.resp.status, 'Action failed with error - ' + content['error']['message'])


def add_user_to_group(auth_token, group_email, user_email):
    directory_service = gutils.get_directory_service(auth_token)
    body = {
        "kind": "admin#directory#member",
        "email": user_email,
        "role": "MEMBER"
    }
    print "Initiating addition of user {} to group {} ...".format(user_email, group_email)
    try:
        response = directory_service.members().insert(groupKey=group_email, body=body).execute()
        return response
        # return response_messages.ResponseMessage(200, "Action completed successfully")
    except Exception as ex:
        content = json.loads(ex.content)
        return  content
        # return response_messages.ResponseMessage(ex.resp.status, 'Action failed with error - ' + content['error']['message'])

def get_applicationDataTransfers_for_gdrive(datatransfer_service):

    results = datatransfer_service.applications().list(maxResults=10).execute()
    applications = results.get('applications', [])
    print 'Applications: {}'.format(applications) 
    applicationDataTransfers = []
    if not applications:
        return applicationDataTransfers
    
    for application in applications:
        if application['name'] == 'Drive and Docs':
            applicationDataTransfer['applicationId'] = application['id']
            applicationDataTransfer['applicationTransferParams'] = application['transferParams']
            applicationDataTransfers.append(applicationDataTransfer)
            break

    return applicationDataTransfers


def transfer_ownership(auth_token, old_owner_email, new_owner_email):
    datatransfer_service = gutils.get_gdrive_datatransfer_service(auth_token)
    print "Initiating data transfer..."
    applicationDataTransfers = get_applicationDataTransfers_for_gdrive(datatransfer_service)

    directory_service = gutils.get_directory_service(auth_token)
    old_user_id = directory_service.users().get(userKey=old_owner_email).execute()
    old_user_id = old_user_id.get('id')
    new_user_id = directory_service.users().get(userKey=new_owner_email).execute()
    new_user_id = new_user_id.get('id')

    transfersResource = {"oldOwnerUserId": old_user_id, "newOwnerUserId": new_user_id,
                            "applicationDataTransfers": applicationDataTransfers}

    response = datatransfer_service.transfers().insert(body=transfersResource).execute()
    print response
    # handle failure in response
    return response

# This class takes at max 100 resource id and update the permission
# here batch data is an array of resource_id and permissionid/useremail list

class AddOrUpdatePermisssionForResource():
    def __init__(self, auth_token, resource_id, permissison_object_batch_data, owner_email):
        self.resource_id = resource_id
        self.batch_data = permissison_object_batch_data
        self.owner_email = owner_email
        self.drive_service = gutils.get_gdrive_service(auth_token, owner_email)

    def add_or_update_permission(self):
        if len(self.batch_data) == 1:
            request = self.get_request(self.batch_data[0])
            try:
                request.execute()
                return response_messages.ResponseMessage(200, "Action completed successfully")
            except Exception as ex:
                content = json.loads(ex.content)
                return response_messages.ResponseMessage(ex.resp.status, 'Action failed with error - ' + content['error']['message'])

        batch_service = self.drive_service.new_batch_http_request(callback=self.batch_request_callback)
        i = 0
        for permission_object in self.batch_data:
            request = self.get_request(permission_object)
            batch_service.add(request)
            i += 1
            if i == 100:
                batch_service.execute()
                i = 0
        if i > 0:
            batch_service.execute()
        return response_messages.ResponseMessage(202, "Action submitted successfully")

    def get_request(self, permission_object):
        permission_id = permission_object.get("permissionId")
        role = permission_object.get("role")
        if not permission_id:
            request = self.create_add_permission_request(permission_object)
        elif permission_id and role:
            request = self.create_update_permission_request(permission_object)
        elif permission_id and (not role):
            request = self.create_delete_permission_request(permission_object)
        return request

    def batch_request_callback(self, request_id, response, exception):
        if exception:
            print exception
            session = FuturesSession()
            push_message = {
                "resourceId": self.resource_id,
                "message": exception.message
            }
            notification = session.post(url=constants.REAL_TIME_URL, json=push_message)
            notification.result()

    def create_add_permission_request(self, permission_object):
        role = permission_object.get('role')
        add_permission_object = {
            "role": role,
            "type": permission_object.get('type'),
            "emailAddress": permission_object.get("emailAddress")

        }
        data = self.drive_service.permissions().create(fileId=self.resource_id, body=add_permission_object,
                                                  transferOwnership=True if role=='owner' else False)
        return data

    def create_update_permission_request(self, permission_object):
        permission_id = permission_object.get("permissionId")
        role = permission_object['role']
        user_permission = {
            'role': role,
        }
        print "user_permission: ", user_permission
        if role == constants.Role.OWNER:
            permission_object['role'] = constants.Role.WRITER
            add_permission_response = self.add_permisssion_for_resource(self.drive_service, permission_object).execute()
            data = self.drive_service.permissions().update(fileId=self.resource_id,
                                                      permissionId=add_permission_response['id'],
                                                      transferOwnership=True,
                                                      body=user_permission)
        else:
            data = self.drive_service.permissions().update(fileId=self.resource_id, permissionId=permission_id,
                                                      body=user_permission)
        return data

    def create_delete_permission_request(self, permission_object):
        permission_id = permission_object["permissionId"]
        data = self.drive_service.permissions().delete(fileId=self.resource_id, permissionId=permission_id)
        return data
