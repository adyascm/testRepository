import json

from sqlalchemy import and_

import gutils
from adya.common.constants import constants
from adya.common.db.action_utils import update_resource_permissions, delete_resource_permission, \
    add_new_permission_to_db
from adya.common.db.connection import db_connection
from adya.common.db.models import DomainGroup
from adya.common.utils.response_messages import Logger


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
        self.drive_service = gutils.get_gdrive_service(auth_token, owner_email)
        self.exception_messages = []
        self.updated_permissions = {}

    def execute(self):
        batch_service = self.drive_service.new_batch_http_request(callback=self.batch_request_callback)
        for request in self.change_requests:
            batch_service.add(request)

        batch_service.execute()

    def batch_request_callback(self, request_id, response, exception):
        if exception:
            Logger().exception("Exception occurred while updating permissions in batch - {}".format(exception))
            content = json.loads(exception.content)
            self.exception_messages.append(content['error']['message'])
        else:
            permission = self.permissions[int(request_id) - 1]
            if not permission['resource_id'] in self.updated_permissions:
                self.updated_permissions[permission['resource_id']] = [permission]
            else:
                self.updated_permissions[permission['resource_id']].append(permission)

    def get_exception_messages(self):
        return self.exception_messages

    def add_permissions(self):
        for permission in self.permissions:
            resource_id = permission['resource_id']
            role = permission['permission_type']
            email = permission['email']
            email_type = "user"
            db_session = db_connection().get_session()
            existing_permission = None
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
            isSuccess = False
            try:
                # check for existing permission only if action role is of 'owner'
                response = request.execute()
                permission['displayName'] = response['displayName'] if 'displayName' in response else ""

                Logger().info("Add permission response from google is - {}".format(response))
                permission['permission_id'] = response['id']
                permission['exposure_type'] = constants.ResourceExposureType.INTERNAL
                isSuccess = True
            except Exception as ex:
                Logger().exception("Exception occurred while adding a new permission")
                content = json.loads(ex.content)
                self.exception_messages.append(content['error']['message'])

            if isSuccess:
                try:
                    new_permission = add_new_permission_to_db(permission, resource_id, self.datasource_id,
                                                              self.initiated_by_email, role)
                    if not permission['resource_id'] in self.updated_permissions:
                        self.updated_permissions[permission['resource_id']] = [new_permission]
                    else:
                        self.updated_permissions[permission['resource_id']].append(new_permission)
                except Exception as ex:
                    Logger().exception("Exception occurred while adding new permission to db")
                    self.exception_messages.append("Exception occurred while adding new permission to db")

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
        try:
            update_resource_permissions(self.initiated_by_email, self.datasource_id, self.updated_permissions)
        except Exception as ex:
            Logger().exception("Exception occurred while updating permission to db")
            self.exception_messages.append("Exception occurred while updating permission to db")
        return self.updated_permissions

    def delete_permissions(self):
        for permission in self.permissions:
            resource_id = permission['resource_id']
            permission_id = permission['permission_id']
            request = self.drive_service.permissions().delete(fileId=resource_id, permissionId=permission_id)
            self.change_requests.append(request)
        self.execute()
        try:
            delete_resource_permission(self.initiated_by_email, self.datasource_id, self.updated_permissions)
        except Exception as ex:
            Logger().exception("Exception occurred while removing permission from db")
            self.exception_messages.append("Exception occurred while removing permission from db")
        return self.updated_permissions


# def update_resource_permissions(initiated_by_email, datasource_id, updated_permissions):
#     db_session = db_connection().get_session()
#     for resource_id in updated_permissions:
#         resource_permissions = updated_permissions[resource_id]
#         new_owner = None
#         for perm in resource_permissions:
#             db_session.query(ResourcePermission).filter(and_(ResourcePermission.datasource_id == datasource_id,
#                                                              ResourcePermission.email == perm['email'],
#                                                              ResourcePermission.resource_id == resource_id)). \
#                                                              update({"permission_type": perm["permission_type"]})
#             if perm["permission_type"] == "owner":
#                 new_owner = perm['email']
#
#         existing_resource = db_session.query(Resource).filter(and_(Resource.resource_id == resource_id,
#                                                                    Resource.datasource_id == datasource_id)).first()
#
#         existing_resource.last_modifying_user_email = initiated_by_email
#         existing_resource.last_modified_time = datetime.datetime.utcnow()
#
#         if new_owner:
#             update_old_owner_permission(db_session, datasource_id, resource_id, new_owner)
#             existing_resource.resource_owner_id = new_owner
#
#     db_connection().commit()


# # db update for delete permission
# def delete_resource_permission(initiated_by_email, datasource_id, updated_permissions):
#     db_session = db_connection().get_session()
#     external_users = {}
#     for resource_id in updated_permissions:
#         deleted_permissions = updated_permissions[resource_id]
#         for perm in deleted_permissions:
#             if perm["exposure_type"] == constants.ResourceExposureType.EXTERNAL and not perm['email'] in external_users:
#                 external_users[perm['email']] = 1
#             db_session.query(ResourcePermission).filter(and_(ResourcePermission.datasource_id == datasource_id,
#                                                              ResourcePermission.email == perm['email'],
#                                                              ResourcePermission.resource_id == resource_id)).delete()
#         db_connection().commit()
#         updated_resource = db_session.query(Resource).filter(and_(Resource.datasource_id == datasource_id,
#                                                                   Resource.resource_id == resource_id)).first()
#         highest_exposure = constants.ResourceExposureType.PRIVATE
#         for resource_perm in updated_resource.permissions:
#             highest_exposure = gutils.get_resource_exposure_type(resource_perm.exposure_type, highest_exposure)
#
#         # Update the resource with highest exposure
#         if not updated_resource.exposure_type == highest_exposure:
#             updated_resource.exposure_type = highest_exposure
#             updated_resource.last_modifying_user_email = initiated_by_email
#             updated_resource.last_modified_time = datetime.datetime.utcnow()
#             db_connection().commit()
#
#     anything_changed = False
#     for external_user in external_users:
#         permissions_count = db_session.query(ResourcePermission).filter(and_(ResourcePermission.datasource_id ==
#                                                                              datasource_id,
#                                                                              ResourcePermission.email == external_user)).count()
#         if permissions_count < 1:
#             db_session.query(DomainUser).filter(
#                 and_(DomainUser.email == external_user, DomainUser.datasource_id == datasource_id,
#                      DomainUser.member_type == constants.UserMemberType.EXTERNAL)).delete()
#             anything_changed = True
#
#     if anything_changed:
#         db_connection().commit()


# # adding a new permission in db
# def add_new_permission_to_db(updated_permission, resource_id, datasource_id, initiated_by_email, role):
#     # If the user does not exist in DomainUser table add now
#     db_session = db_connection().get_session()
#     existing_user = db_session.query(DomainUser).filter(
#         and_(DomainUser.datasource_id == datasource_id,
#              DomainUser.email == updated_permission['email'])).first()
#
#     if not existing_user:
#         # Update the exposure type of the permission
#         updated_permission['exposure_type'] = constants.ResourceExposureType.EXTERNAL
#         domainUser = DomainUser()
#         domainUser.datasource_id = datasource_id
#         domainUser.email = updated_permission['email']
#         domainUser.member_type = constants.UserMemberType.EXTERNAL
#         display_name = updated_permission['displayName']
#         name = display_name.split(' ')
#         if len(name) > 0 and name[0]:
#             domainUser.first_name = name[0]
#             if len(name) > 1:
#                 domainUser.last_name = name[1]
#         else:
#             domainUser.first_name = domainUser.email
#             domainUser.last_name = ""
#         db_session.add(domainUser)
#         db_connection().commit()
#     else:
#         # case: add permission to external user if that user already exist , than exposure type of permission should also be external
#         if existing_user.member_type == constants.UserMemberType.EXTERNAL:
#             updated_permission['exposure_type'] = constants.ResourceExposureType.EXTERNAL
#
#     permission = ResourcePermission()
#     permission.datasource_id = datasource_id
#     permission.resource_id = resource_id
#     permission.email = updated_permission['email']
#     permission.permission_type = updated_permission['permission_type']
#     permission.permission_id = updated_permission['permission_id']
#     permission.exposure_type = updated_permission['exposure_type']
#     db_session.add(permission)
#
#     # Update the exposure type of the resource based on the updated permission
#     existing_resource = db_session.query(Resource).filter(and_(Resource.resource_id == resource_id,
#                                                                Resource.datasource_id == datasource_id)).first()
#     if permission.exposure_type == constants.ResourceExposureType.EXTERNAL:
#         if not (
#                 existing_resource.exposure_type == constants.ResourceExposureType.EXTERNAL and existing_resource.exposure_type == constants.ResourceExposureType.PUBLIC):
#             existing_resource.exposure_type = constants.ResourceExposureType.EXTERNAL
#
#     else:
#         if existing_resource.exposure_type == constants.ResourceExposureType.PRIVATE:
#             existing_resource.exposure_type = constants.ResourceExposureType.INTERNAL
#
#     existing_resource.last_modifying_user_email = initiated_by_email
#     existing_resource.last_modified_time = datetime.datetime.utcnow()
#
#     if role == constants.Role.OWNER:
#         existing_resource.resource_owner_id = updated_permission['email']
#         update_old_owner_permission(db_session, datasource_id, resource_id, updated_permission['email'])
#
#     db_connection().commit()
#     return permission


# def update_old_owner_permission(db_session, datasource_id, resource_id, updated_email):
#     resource_permission = db_session.query(ResourcePermission).filter(
#         and_(ResourcePermission.resource_id == resource_id,
#              ResourcePermission.datasource_id == datasource_id, ResourcePermission.email <> updated_email,
#              ResourcePermission.permission_type == constants.Role.OWNER)).update(
#         {ResourcePermission.permission_type: constants.Role.WRITER})
#
#     return resource_permission