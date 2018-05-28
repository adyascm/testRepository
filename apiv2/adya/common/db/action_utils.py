# db update for delete permission
import datetime
from sqlalchemy import and_

from adya.common.constants import constants
from adya.common.db.connection import db_connection
from adya.common.db.models import ResourcePermission, Resource, DomainUser
from adya.gsuite import gutils


def update_resource_permissions(initiated_by_email, datasource_id, updated_permissions):
    db_session = db_connection().get_session()
    for resource_id in updated_permissions:
        resource_permissions = updated_permissions[resource_id]
        new_owner = None
        for perm in resource_permissions:
            db_session.query(ResourcePermission).filter(and_(ResourcePermission.datasource_id == datasource_id,
                                                             ResourcePermission.email == perm['email'],
                                                             ResourcePermission.resource_id == resource_id)). \
                                                             update({"permission_type": perm["permission_type"]})
            if perm["permission_type"] == "owner":
                new_owner = perm['email']

        existing_resource = db_session.query(Resource).filter(and_(Resource.resource_id == resource_id,
                                                                   Resource.datasource_id == datasource_id)).first()

        existing_resource.last_modifying_user_email = initiated_by_email
        existing_resource.last_modified_time = datetime.datetime.utcnow()

        if new_owner:
            update_old_owner_permission(db_session, datasource_id, resource_id, new_owner)
            existing_resource.resource_owner_id = new_owner

    db_connection().commit()

# adding a new permission in db
def add_new_permission_to_db(updated_permission, resource_id, datasource_id, initiated_by_email, role):
    # If the user does not exist in DomainUser table add now
    db_session = db_connection().get_session()
    existing_user = db_session.query(DomainUser).filter(
        and_(DomainUser.datasource_id == datasource_id,
             DomainUser.email == updated_permission['email'])).first()

    if not existing_user:
        # Update the exposure type of the permission
        updated_permission['exposure_type'] = constants.ResourceExposureType.EXTERNAL
        domainUser = DomainUser()
        domainUser.datasource_id = datasource_id
        domainUser.email = updated_permission['email']
        domainUser.member_type = constants.UserMemberType.EXTERNAL
        display_name = updated_permission['displayName']
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
    else:
        # case: add permission to external user if that user already exist , than exposure type of permission should also be external
        if existing_user.member_type == constants.UserMemberType.EXTERNAL:
            updated_permission['exposure_type'] = constants.ResourceExposureType.EXTERNAL

    permission = ResourcePermission()
    permission.datasource_id = datasource_id
    permission.resource_id = resource_id
    permission.email = updated_permission['email']
    permission.permission_type = updated_permission['permission_type']
    permission.permission_id = updated_permission['permission_id']
    permission.exposure_type = updated_permission['exposure_type']
    db_session.add(permission)

    # Update the exposure type of the resource based on the updated permission
    existing_resource = db_session.query(Resource).filter(and_(Resource.resource_id == resource_id,
                                                               Resource.datasource_id == datasource_id)).first()
    if permission.exposure_type == constants.ResourceExposureType.EXTERNAL:
        if not (
                existing_resource.exposure_type == constants.ResourceExposureType.EXTERNAL and existing_resource.exposure_type == constants.ResourceExposureType.PUBLIC):
            existing_resource.exposure_type = constants.ResourceExposureType.EXTERNAL

    else:
        if existing_resource.exposure_type == constants.ResourceExposureType.PRIVATE:
            existing_resource.exposure_type = constants.ResourceExposureType.INTERNAL

    existing_resource.last_modifying_user_email = initiated_by_email
    existing_resource.last_modified_time = datetime.datetime.utcnow()

    if role == constants.Role.OWNER:
        existing_resource.resource_owner_id = updated_permission['email']
        update_old_owner_permission(db_session, datasource_id, resource_id, updated_permission['email'])

    db_connection().commit()
    return permission


def update_old_owner_permission(db_session, datasource_id, resource_id, updated_email):
    resource_permission = db_session.query(ResourcePermission).filter(
        and_(ResourcePermission.resource_id == resource_id,
             ResourcePermission.datasource_id == datasource_id, ResourcePermission.email <> updated_email,
             ResourcePermission.permission_type == constants.Role.OWNER)).update(
        {ResourcePermission.permission_type: constants.Role.WRITER})

    return resource_permission


def delete_resource_permission(initiated_by_email, datasource_id, updated_permissions):
    db_session = db_connection().get_session()
    external_users = {}
    for resource_id in updated_permissions:
        deleted_permissions = updated_permissions[resource_id]
        for perm in deleted_permissions:
            if perm["exposure_type"] == constants.ResourceExposureType.EXTERNAL and not perm['email'] in external_users:
                external_users[perm['email']] = 1
            db_session.query(ResourcePermission).filter(and_(ResourcePermission.datasource_id == datasource_id,
                                                             ResourcePermission.email == perm['email'],
                                                             ResourcePermission.resource_id == resource_id)).delete()
        db_connection().commit()
        updated_resource = db_session.query(Resource).filter(and_(Resource.datasource_id == datasource_id,
                                                                  Resource.resource_id == resource_id)).first()
        highest_exposure = constants.ResourceExposureType.PRIVATE
        for resource_perm in updated_resource.permissions:
            highest_exposure = gutils.get_resource_exposure_type(resource_perm.exposure_type, highest_exposure)

        # Update the resource with highest exposure
        if not updated_resource.exposure_type == highest_exposure:
            updated_resource.exposure_type = highest_exposure
            updated_resource.last_modifying_user_email = initiated_by_email
            updated_resource.last_modified_time = datetime.datetime.utcnow()
            db_connection().commit()

    anything_changed = False
    for external_user in external_users:
        permissions_count = db_session.query(ResourcePermission).filter(and_(ResourcePermission.datasource_id ==
                                                                             datasource_id,
                                                                             ResourcePermission.email == external_user)).count()
        if permissions_count < 1:
            db_session.query(DomainUser).filter(
                and_(DomainUser.email == external_user, DomainUser.datasource_id == datasource_id,
                     DomainUser.member_type == constants.UserMemberType.EXTERNAL)).delete()
            anything_changed = True

    if anything_changed:
        db_connection().commit()
