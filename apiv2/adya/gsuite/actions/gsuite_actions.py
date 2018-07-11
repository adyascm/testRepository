import json

from sqlalchemy import and_

from adya.gsuite import gutils
from adya.common.constants import constants
from adya.common.db.action_utils import update_resource_permissions, delete_resource_permission, \
    add_new_permission_to_db
from adya.common.db.connection import db_connection
from adya.common.db.models import DomainUser
from adya.common.utils.response_messages import Logger, ResponseMessage
from googleapiclient.errors import HttpError


def delete_user_from_group(auth_token, group_email, user_email):
    directory_service = gutils.get_directory_service(auth_token)
    Logger().info("Initiating removal of user {} from group {} ...".format(user_email, group_email))
    try:
        response = directory_service.members().delete(groupKey=group_email, memberKey=user_email).execute()
        return ResponseMessage(200, None, response)
    except Exception as ex:
        content = json.loads(ex.content) if ex.content else {}
        return ResponseMessage(500, None, content)


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
        return ResponseMessage(200, None, response)
    except Exception as ex:
        content = json.loads(ex.content) if ex.content else {}
        return ResponseMessage(500, None, content)


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
    try:
        response = datatransfer_service.transfers().insert(body=transfersResource).execute()
        Logger().info(str(response))
        return ResponseMessage(200, None, response)
    except Exception as ex:
        content = json.loads(ex.content) if ex.content else {}
        return ResponseMessage(500, None, content)


def add_permissions(auth_token, permissions, owner_email, initiated_by_email, datasource_id, domain_id):
    is_success = True
    exception_messages = ""
    drive_service = gutils.get_gdrive_service(auth_token, owner_email)
    for permission in permissions:
        resource_id = permission['resource_id']
        role = permission['permission_type']
        email = permission['email']
        email_type = "user"
        db_session = db_connection().get_session()
        existing_group = db_session.query(DomainUser).filter(
            and_(DomainUser.datasource_id == permission['datasource_id'],
                    DomainUser.email == email)).first()

        if existing_group:
            email_type = "group"

        add_permission_object = {
            "role": role,
            "type": email_type,
            "emailAddress": email

        }

        request = drive_service.permissions().create(fileId=resource_id, body=add_permission_object, quotaUser= owner_email[0:41],
                                                            transferOwnership=True if role == 'owner' else False,
                                                            fields='id, emailAddress, type, kind, displayName')
        try:
            # check for existing permission only if action role is of 'owner'
            response = request.execute()
            permission['displayName'] = response['displayName'] if 'displayName' in response else ""

            Logger().info("Add permission response from google is - {}".format(response))
            permission['permission_id'] = response['id']

            add_new_permission_to_db(permission, resource_id, datasource_id, initiated_by_email, role, domain_id)

        except Exception as ex:
            Logger().exception("Exception occurred while adding a new permission")
            is_success = False
            if ex.content:
                content = json.loads(ex.content)
                exception_messages += content['error']['message']
            else:
                exception_messages += "Exception occurred while adding new permission to db"

    return ResponseMessage(200 if is_success else 500, exception_messages)

def update_permissions(auth_token, permissions, owner_email, initiated_by_email, datasource_id):
    drive_service = gutils.get_gdrive_service(auth_token, owner_email)
    updated_permissions = {}
    deleted_permissions = {}
    is_success = True
    exception_messages = ""
    for permission in permissions:
        resource_id = permission['resource_id']
        permission_id = permission['permission_id']
        role = permission['permission_type']
        update_permission_object = {
            "role": role,
        }
        try:
            drive_service.permissions().update(fileId=resource_id, body=update_permission_object, quotaUser= owner_email[0:41],
                                                            permissionId=permission_id,
                                                            transferOwnership=True if role == 'owner' else False).execute()
            if not permission['resource_id'] in updated_permissions:
                updated_permissions[permission['resource_id']] = [permission]
            else:
                updated_permissions[permission['resource_id']].append(permission)
        except HttpError as e:
            if e.resp.status == 404:
                Logger().info("Permission not found in gsuite, hence delete from db")
                deleted_permissions[permission['resource_id']] = [permission]
            else:
                Logger().exception("HttpError Exception occurred while updating permissions in gsuite" + ex)
                is_success = False
                exception_messages += e
        except Exception as ex:
            Logger().exception("Exception occurred while updating permissions in gsuite" + ex)
            is_success = False
            exception_messages += ex
    try:
        update_resource_permissions(initiated_by_email, datasource_id, updated_permissions)
        if len(deleted_permissions) > 0:
            delete_resource_permission(initiated_by_email, datasource_id, deleted_permissions)
    except Exception as ex:
        Logger().exception("Exception occurred while updating permission from db")
        is_success = False
        exception_messages += "Exception occurred while updating permission from db"

    return ResponseMessage(200 if is_success else 500, exception_messages)

def delete_permissions(auth_token, permissions, owner_email, initiated_by_email, datasource_id):
    drive_service = gutils.get_gdrive_service(auth_token, owner_email)
    updated_permissions = {}
    is_success = True
    exception_messages = ""
    for permission in permissions:
        resource_id = permission['resource_id']
        permission_id = permission['permission_id']
        try:
            drive_service.permissions().delete(fileId=resource_id, quotaUser= owner_email[0:41], permissionId=permission_id).execute()
            if not permission['resource_id'] in updated_permissions:
                updated_permissions[permission['resource_id']] = [permission]
            else:
                updated_permissions[permission['resource_id']].append(permission)
        except HttpError as ex:
            if ex.resp.status == 401:
                Logger().warn("Permission not found : permission - {} : ex - {}".format(permission, ex))
                updated_permissions[permission['resource_id']] = [permission]
            else:
                Logger().exception("Exception occurred while deleting permissions in gsuite : permission - {}".format(permission))
                is_success = False
                exception_messages += ex
        except Exception as ex:
            Logger().exception("Exception occurred while deleting permissions in gsuite : permission - {}".format(permission))
            is_success = False
            exception_messages += ex
        
    try:
        delete_resource_permission(initiated_by_email, datasource_id, updated_permissions)
    except Exception:
        Logger().exception("Exception occurred while removing permission from db")
        is_success = False
        exception_messages += "Exception occurred while removing permission from db"

    return ResponseMessage(200 if is_success else 500, exception_messages)
