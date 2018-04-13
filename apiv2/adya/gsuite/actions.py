import datetime
import json
import gutils
from adya.common.utils import utils, response_messages
from adya.common.constants import constants, action_constants
from sqlalchemy import and_
from requests_futures.sessions import FuturesSession
from adya.common.db.connection import db_connection
from adya.common.utils.response_messages import Logger
from adya.common.db.models import DomainUser, Resource, DataSource, ResourcePermission, DomainGroup, alchemy_encoder

def delete_user_from_group(auth_token, group_email, user_email):
    directory_service = gutils.get_directory_service(auth_token)
    Logger().info("Initiating removal of user {} from group {} ...".format(user_email, group_email))
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
    Logger().info("Initiating addition of user {} to group {} ...".format(user_email, group_email))
    try:
        response = directory_service.members().insert(groupKey=group_email, body=body).execute()
        return response
        # return response_messages.ResponseMessage(200, "Action completed successfully")
    except Exception as ex:
        content = json.loads(ex.content)
        return content
        # return response_messages.ResponseMessage(ex.resp.status, 'Action failed with error - ' + content['error']['message'])


def get_applicationDataTransfers_for_gdrive(datatransfer_service):
    results = datatransfer_service.applications().list(maxResults=10).execute()
    applications = results.get('applications', [])
    Logger().info('Applications: {}'.format(applications))
    applicationDataTransfers = []
    if not applications:
        return applicationDataTransfers

    for application in applications:
        if application['name'] == 'Drive and Docs':
            applicationDataTransfer = {}
            applicationDataTransfer['applicationId'] = application['id']
            applicationDataTransfer['applicationTransferParams'] = application['transferParams']
            applicationDataTransfers.append(applicationDataTransfer)
            break

    return applicationDataTransfers


def transfer_ownership(auth_token, old_owner_email, new_owner_email):
    datatransfer_service = gutils.get_gdrive_datatransfer_service(auth_token)
    Logger().info("Initiating data transfer...")
    applicationDataTransfers = get_applicationDataTransfers_for_gdrive(datatransfer_service)

    directory_service = gutils.get_directory_service(auth_token)
    old_user_id = directory_service.users().get(userKey=old_owner_email).execute()
    old_user_id = old_user_id.get('id')
    new_user_id = directory_service.users().get(userKey=new_owner_email).execute()
    new_user_id = new_user_id.get('id')

    transfersResource = {"oldOwnerUserId": old_user_id, "newOwnerUserId": new_user_id,
                         "applicationDataTransfers": applicationDataTransfers}

    response = datatransfer_service.transfers().insert(body=transfersResource).execute()
    Logger().info(str(response))
    # handle failure in response
    return response


# This class takes at max 100 resource id and update the permission
# here batch data is an array of resource_id and permissionid/useremail list

class AddOrUpdatePermisssionForResource():
    def __init__(self, auth_token, permissions, owner_email, initiated_by_email, datasource_id):
        self.initiated_by_email = initiated_by_email
        self.datasource_id = datasource_id
        self.permissions = permissions
        self.owner_email = owner_email
        self.change_requests = []
        self.drive_service = gutils.get_gdrive_service(auth_token, initiated_by_email)
        self.exception_message = ""
        self.updated_permissions = {}

    def execute(self):
        batch_service = self.drive_service.new_batch_http_request(callback=self.batch_request_callback)
        for request in self.change_requests:
            batch_service.add(request)

        batch_service.execute()

    def batch_request_callback(self, request_id, response, exception):
        if exception:
            Logger().exception("Exception occurred while updating permissions in batch - {}".format(exception))
            self.exception_message = str(exception)
        else:
            permission = self.permissions[int(request_id)-1]
            if not permission['resource_id'] in self.updated_permissions:
                self.updated_permissions[permission['resource_id']] = [permission]
            else:
                self.updated_permissions[permission['resource_id']].append(permission)

    def get_exception_message(self):
        return self.exception_message

    def add_permissions(self):
        for permission in self.permissions:
            resource_id = permission['resource_id']
            role = permission['permission_type']
            email = permission['email']
            email_type = "user"
            db_session = db_connection().get_session()
            existing_group = db_session.query(DomainGroup).filter(
                    and_(DomainGroup.datasource_id == permission['datasource_id'],
                         DomainGroup.email == email)).first()

            if existing_group:
                email_type = "group"
            
            add_permission_object = {
                "role": role,
                "type": email_type,
                "emailAddress": email

            }
            request = self.drive_service.permissions().create(fileId=resource_id, body=add_permission_object,
                                                              transferOwnership=True if role == 'owner' else False,
                                                              fields='id, emailAddress, type, kind, displayName')
            try:
                response = request.execute()
                Logger().info("Add permission response from google is - {}".format(response))
                permission['permission_id'] = response['id']
                permission['exposure_type'] = constants.ResourceExposureType.INTERNAL

                # If the user does not exist in DomainUser table add now
                existing_user = db_session.query(DomainUser).filter(
                    and_(DomainUser.datasource_id == permission['datasource_id'],
                         DomainUser.email == permission['email'])).first()
                if not existing_user:
                    permission['exposure_type'] = constants.ResourceExposureType.EXTERNAL
                    domainUser = DomainUser()
                    domainUser.datasource_id = permission['datasource_id']
                    domainUser.email = permission['email']
                    domainUser.member_type = constants.UserMemberType.EXTERNAL
                    display_name = response['displayName'] if 'displayName' in response else ""
                    name = display_name.split(' ')
                    
                    if len(name) > 0 and name[0]:
                        domainUser.first_name = name[0]
                        if len(name) > 1:
                            domainUser.last_name = name[1]
                    else:
                        domainUser.first_name = domainUser.email
                        domainUser.last_name = ""
                    db_session.add(domainUser)
                    db_connection().commit()

            except Exception as ex:
                Logger().exception("Exception occurred while adding a new permission")
                content = json.loads(ex.content)
                self.exception_message = content['error']['message']
            new_permission = add_new_permission_to_db(permission, resource_id, self.datasource_id, self.initiated_by_email)
            if not permission['resource_id'] in self.updated_permissions:
                self.updated_permissions[permission['resource_id']] = [new_permission]
            else:
                self.updated_permissions[permission['resource_id']].append(new_permission)

        return self.updated_permissions

    def update_permissions(self):
        for permission in self.permissions:
            resource_id = permission['resource_id']
            permission_id = permission['permission_id']
            role = permission['permission_type']
            update_permission_object = {
                "role": role,
            }
            request = self.drive_service.permissions().update(fileId=resource_id, body=update_permission_object,
                                                              permissionId=permission_id,
                                                              transferOwnership=True if role == 'owner' else False)
            self.change_requests.append(request)
        self.execute()
        update_resource_permissions(self.initiated_by_email, self.datasource_id, self.updated_permissions)
        return self.updated_permissions

    def delete_permissions(self):
        for permission in self.permissions:
            resource_id = permission['resource_id']
            permission_id = permission['permission_id']
            request = self.drive_service.permissions().delete(fileId=resource_id, permissionId=permission_id)
            self.change_requests.append(request)
        self.execute()
        delete_resource_permission(self.initiated_by_email, self.datasource_id, self.updated_permissions)
        return self.updated_permissions

def update_resource_permissions(initiated_by_email, datasource_id, updated_permissions):
    db_session = db_connection().get_session()
    for resource_id in updated_permissions:
        resource_permissions = updated_permissions[resource_id]
        for perm in resource_permissions:
            db_session.query(ResourcePermission).filter(and_(ResourcePermission.datasource_id == datasource_id,
                                                             ResourcePermission.email == perm['email'],
                                                             ResourcePermission.resource_id == resource_id)).update({"permission_type": perm.permission_type})
    db_connection().commit()

# db update for delete permission
def delete_resource_permission(initiated_by_email, datasource_id, updated_permissions):
    db_session = db_connection().get_session()
    for resource_id in updated_permissions:
        deleted_permissions = updated_permissions[resource_id]
        for perm in deleted_permissions:
            db_session.query(ResourcePermission).filter(and_(ResourcePermission.datasource_id == datasource_id,
                                                             ResourcePermission.email == perm['email'],
                                                             ResourcePermission.resource_id == resource_id)).delete()
        db_connection().commit()
        updated_resource = db_session.query(Resource).filter(and_(Resource.datasource_id == datasource_id,
                                                             Resource.resource_id == resource_id)).first()
        highest_exposure = constants.ResourceExposureType.PRIVATE
        for resource_perm in updated_resource.permissions:
            if resource_perm.exposure_type == constants.ResourceExposureType.PUBLIC:
                highest_exposure = constants.ResourceExposureType.PUBLIC
                break
            elif resource_perm.exposure_type == constants.ResourceExposureType.EXTERNAL and not highest_exposure == constants.ResourceExposureType.PUBLIC:
                highest_exposure = constants.ResourceExposureType.EXTERNAL
            elif resource_perm.exposure_type == constants.ResourceExposureType.DOMAIN and not (highest_exposure == constants.ResourceExposureType.PUBLIC and highest_exposure == constants.ResourceExposureType.EXTERNAL):
                highest_exposure = constants.ResourceExposureType.DOMAIN
            elif resource_perm.exposure_type == constants.ResourceExposureType.INTERNAL and not (highest_exposure == constants.ResourceExposureType.PUBLIC and highest_exposure == constants.ResourceExposureType.EXTERNAL and highest_exposure == constants.ResourceExposureType.DOMAIN):
                highest_exposure = constants.ResourceExposureType.INTERNAL
        #Update the resource with highest exposure
        if not updated_resource.exposure_type == highest_exposure:
            updated_resource.exposure_type = highest_exposure
            updated_resource.last_modifying_user_email = initiated_by_email
            updated_resource.last_modified_time = datetime.datetime.utcnow()
            db_connection().commit()

# adding a new permission in db
def add_new_permission_to_db(updated_permission, resource_id, datasource_id, initiated_by_email):
    db_session = db_connection().get_session()
    permission = ResourcePermission()
    permission.datasource_id = datasource_id
    permission.resource_id = resource_id
    permission.email = updated_permission['email']
    permission.permission_type = updated_permission['permission_type']
    permission.permission_id = updated_permission['permission_id']
    permission.exposure_type = updated_permission['exposure_type']
    db_session.add(permission)

    #Update the exposure type of the resource based on the updated permission
    existing_resource = db_session.query(Resource).filter(and_(Resource.resource_id == resource_id,
                                                               Resource.datasource_id == datasource_id)).first()
    if permission.exposure_type == constants.ResourceExposureType.EXTERNAL:
        if not (existing_resource.exposure_type == constants.ResourceExposureType.EXTERNAL and existing_resource.exposure_type == constants.ResourceExposureType.PUBLIC):
            existing_resource.exposure_type = constants.ResourceExposureType.EXTERNAL

    else:
        if existing_resource.exposure_type == constants.ResourceExposureType.PRIVATE:
            existing_resource.exposure_type = constants.ResourceExposureType.INTERNAL

    existing_resource.last_modifying_user_email = initiated_by_email
    existing_resource.last_modified_time = datetime.datetime.utcnow()
    db_connection().commit()
    return permission