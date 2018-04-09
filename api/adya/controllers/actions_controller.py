import traceback

from adya.common import constants, action_constants, messaging, response_messages
from adya.common.constants import ResponseType
from adya.datasources.google import actions, gutils
from adya.datasources.google.scan import get_resource_exposure_type
from adya.db.models import AuditLog, Action, Application, ApplicationUserAssociation, ResourcePermission, Resource, \
    DirectoryStructure, DomainUser, DataSource
from adya.db.connection import db_connection
from adya.common.response_messages import ResponseMessage
from sqlalchemy import and_, or_
import json
from datetime import datetime


def get_actions():
    # if not datasource_type:
    #    return "Please pass a valid datasource_type in order to get all the actions enabled for it."
    # db_session = db_connection().get_session()
    # actions = db_session.query(Action).filter(Action.datasource_type == datasource_type).all()

    # if not actions:
    #   raise Exception("Couldn't fetch actions")
    # elif len(actions) == 0:
    #   raise Exception("No actions defined for datasource_type: " + datasource_type)
    transferOwnershipAction = instantiate_action("GSUITE", action_constants.ActionNames.TRANSFER_OWNERSHIP,
                                                 "Transfer Ownership",
                                                 "Transfer ownership of all documents owned by selected user",
                                                 [{"key": "old_owner_email", "label": "Old User", "editable": 0},
                                                     {"key": "new_owner_email", "label": "New User", "editable": 1}],
                                                 True)

    changeOwnerOfFileAction = instantiate_action("GSUITE", action_constants.ActionNames.CHANGE_OWNER_OF_FILE,
                                                 "Transfer Ownership",
                                                 "Transfer ownership of the selected document",
                                                 [{"key": "resource_id", "label": "Selected document", "editable": 0, "hidden": 1},
                                                {"key": "resource_name", "label": "Selected document", "editable": 0},
                                                {"key": "old_owner_email", "label": "Old User", "editable": 0},
                                                {"key": "new_owner_email", "label": "New User", "editable": 1}],
                                                 False)

    removeExternalAccessAction = instantiate_action("GSUITE", action_constants.ActionNames.REMOVE_EXTERNAL_ACCESS,
                                                    "Remove external sharing",
                                                    "Remove access from outside the company for all documents owned by selected user",
                                                    [{"key": "user_email", "label": "For user", "editable": 0}],
                                                    False)

    removeExternalAccessToResourceAction = instantiate_action("GSUITE",
                                                              action_constants.ActionNames.REMOVE_EXTERNAL_ACCESS_TO_RESOURCE,
                                                              "Remove external sharing",
                                                              "Remove access from outside the company for selected document",
                                                              [{"key": "resource_id", "label": "Selected document", "editable": 0, "hidden": 1},
                                                               {"key": "resource_name", "label": "Selected document", "editable": 0}], False)

    makeAllFilesPrivateAction = instantiate_action("GSUITE", action_constants.ActionNames.MAKE_ALL_FILES_PRIVATE,
                                                   "Remove all sharing",
                                                   "Remove access to everyone for all documents owned by selected user",
                                                   [{"key": "user_email", "label": "For user", "editable": 0}],
                                                   False)

    makeResourcePrivateAction = instantiate_action("GSUITE", action_constants.ActionNames.MAKE_RESOURCE_PRIVATE,
                                                   "Remove all sharing",
                                                   "Remove access to everyone (except owner) for selected document",
                                                   [{"key": "resource_id", "label": "Selected document", "editable": 0, "hidden": 1},
                                                    {"key": "resource_name", "label": "Selected document", "editable": 0}], False)

    deletePermissionForUserAction = instantiate_action("GSUITE",
                                                       action_constants.ActionNames.DELETE_PERMISSION_FOR_USER,
                                                       "Remove sharing",
                                                       "Remove sharing of selected document with user",
                                                       [{"key": "resource_id", "label": "Selected document",
                                                         "editable": 0, "hidden": 1},
                                                        {"key": "resource_name", "label": "Selected document",
                                                         "editable": 0},
                                                        {"key": "resource_owner_id", "label": "Owner of file",
                                                         "editable": 0},
                                                        {"key": "user_email", "label": "For User", "editable": 0}],
                                                       False)

    updatePermissionForUserAction = instantiate_action("GSUITE",
                                                       action_constants.ActionNames.UPDATE_PERMISSION_FOR_USER,
                                                       "Change permission",
                                                       "Change permission for selected document with user",
                                                       [{"key": "resource_id", "label": "Selected document",
                                                         "editable": 0, "hidden": 1},
                                                        {"key": "resource_name", "label": "Selected document",
                                                         "editable": 0},
                                                        {"key": "resource_owner_id", "label": "Owner of file",
                                                         "editable": 0},
                                                        {"key": "user_email",
                                                         "label": "For User", "editable": 0},
                                                        {"key": "new_permission_role", "label": "New permission",
                                                         "editable": 1}], False)

    watchActionForUser = instantiate_action("GSUITE", action_constants.ActionNames.WATCH_ALL_ACTION_FOR_USER,
                                            "Watch activity",
                                            "Get weekly report of all activities for selected user",
                                            [{"key": "user_email", "label": "For user", "editable": 0}], False)

    removeAllAction = instantiate_action("GSUITE", action_constants.ActionNames.REMOVE_ALL_ACCESS_FOR_USER,
                                        "Remove sharing",
                                         "Remove access to selected user for any documents owned by others", [
                                             {"key": "user_email", "label": "For user", "editable": 0}],
                                         False)

    removeUserFromGroup = instantiate_action("GSUITE", action_constants.ActionNames.REMOVE_USER_FROM_GROUP,
                                            "Change groups",
                                             "Remove user from a group",
                                             [{"key": "user_email", "label": "For user", "editable": 0},
                                                {"key": "group_email", "label": "For Group", "editable": 0}], False)

    addUserToGroup = instantiate_action("GSUITE", action_constants.ActionNames.ADD_USER_TO_GROUP,
                                            "Change groups",
                                            "Add user to a group",
                                            [{"key": "user_email", "label": "For user", "editable": 0},
                                            {"key": "group_email", "label": "For Group", "editable": 1}], False)

    addPermissionForFile = instantiate_action("GSUITE", action_constants.ActionNames.ADD_PERMISSION_FOR_A_FILE,
                                            "Add sharing",
                                              "Share the selected resource with user",
                                              [{"key": "user_email", "label": "For user", "editable": 1},
                                                {"key": "resource_id", "label": "Selected document", "editable": 0, "hidden": 1},
                                                {"key": "resource_name", "label": "Selected document", "editable": 0},
                                                {"key": "new_permission_role", "label": "New permission", "editable": 0},
                                                {"key": "resource_owner_id", "label": "Owner of file", "editable": 0},
                                                {"key": "user_type", "label": "User Type", "editable": 0}], False)

    actions = [transferOwnershipAction,
               changeOwnerOfFileAction,
               deletePermissionForUserAction,
               makeAllFilesPrivateAction,
               makeResourcePrivateAction,
               removeExternalAccessAction,
               removeExternalAccessToResourceAction,
               updatePermissionForUserAction,
               watchActionForUser,
               removeAllAction,
               removeUserFromGroup,
               addUserToGroup,
               addPermissionForFile
               ]

    return actions


def instantiate_action(datasource_type, key, name, description, parameters, is_admin_only):
    actionObject = Action()
    actionObject.datasource_type = datasource_type
    actionObject.key = key
    actionObject.name = name
    actionObject.description = description
    actionObject.parameters = parameters
    actionObject.is_admin_only = is_admin_only

    return actionObject


def get_action(action_to_take):
    actions_list = get_actions()
    for action in actions_list:
        if action.key == action_to_take:
            return action
    return None


def initiate_action(auth_token, domain_id, datasource_id, action_payload):
    try:
        action_to_take = action_payload['key']
        initiated_by = action_payload['initiated_by']
        action_parameters = action_payload['parameters']

        action_config = get_action(action_to_take)

        if not action_config or not validate_action_parameters(action_config, action_parameters):
            return ResponseMessage(400, "Failed to execute action - Validation failed")

        execution_status = execute_action(auth_token, domain_id, datasource_id, action_config, action_payload)
        audit_action(domain_id, datasource_id, initiated_by, action_to_take, action_parameters)
        return execution_status

    except Exception as e:
        print e
        print traceback.print_exc()
        print "Exception occurred while initiating action using payload ", action_payload, " on domain: ", domain_id, " and datasource: ", datasource_id
        return ResponseMessage(500, "Failed to execute action - {}".format(e))

def create_watch_report(auth_token, datasource_id, action_payload):
    action_parameters = action_payload['parameters']
    user_email = str(action_parameters['user_email'])
    form_input = {}
    form_input['name'] = "Activity for " + user_email
    form_input['description'] = "Activity for " + user_email
    form_input['frequency'] = "cron(0 9 ? * 2 *)"
    form_input['receivers'] = action_payload['initiated_by']
    form_input['report_type'] = "Activity"
    form_input['selected_entity_type'] = "user"
    form_input['selected_entity'] = user_email
    form_input['selected_entity_name'] = user_email
    form_input['is_active'] = 0
    form_input['datasource_id'] = datasource_id
    messaging.trigger_post_event(constants.GET_SCHEDULED_REPORT_PATH, auth_token, None, form_input)
    return ResponseMessage(201, "Watch report created for {}".format(user_email))

def add_resource_permission(auth_token, datasource_id, action_payload):
    action_parameters = action_payload['parameters']
    new_permission_role = action_parameters['new_permission_role']
    user_type = action_parameters['user_type'] if 'user_type' in action_parameters else 'user'
    resource_id = action_parameters['resource_id']
    resource_owner = action_parameters['resource_owner_id']
    current_time = datetime.utcnow()

    permission = ResourcePermission()
    permission.datasource_id = datasource_id
    permission.resource_id = resource_id
    permission.email = action_parameters['user_email']
    permission.permission_type = new_permission_role
    gsuite_action = actions.AddOrUpdatePermisssionForResource(auth_token, [permission], resource_owner)
    updated_permissions = gsuite_action.add_permissions()

    if len(updated_permissions) < 1:
        return response_messages.ResponseMessage(400, 'Action failed with error - ' + gsuite_action.get_exception_message())


    db_session = db_connection().get_session()

    db_session.add(updated_permissions[0])

    existing_resource = db_session.query(Resource).filter(and_(Resource.resource_id == resource_id,
                                                               Resource.datasource_id == datasource_id)).first()
    existing_resource = update_exposure_type_of_resource(db_session, updated_permissions[0], existing_resource, None)
    existing_resource.last_modifying_user_email = action_payload['initiated_by']
    existing_resource.last_modified_time = current_time
    db_connection().commit()
    return response_messages.ResponseMessage(200, 'Action completed successfully')


def update_or_delete_resource_permission(auth_token, datasource_id, action_payload):
    action_parameters = action_payload['parameters']
    new_permission_role = action_parameters['new_permission_role']
    user_type = action_parameters['user_type'] if 'user_type' in action_parameters else 'user'
    resource_id = action_parameters['resource_id']
    resource_owner = action_parameters['resource_owner_id']
    user_email = action_parameters['user_email']
    initiated_user = action_payload['initiated_by']
    current_time = datetime.utcnow()
    db_session = db_connection().get_session()
    existing_permission = db_session.query(ResourcePermission).filter(
                        and_(ResourcePermission.resource_id == resource_id,
                            ResourcePermission.datasource_id == datasource_id,
                            ResourcePermission.email == user_email)).first()

    if not existing_permission and action_payload['key'] == action_constants.ActionNames.CHANGE_OWNER_OF_FILE:
        print "add a new permission "
        action_payload["new_permission_role"]= constants.Role.WRITER
        response = add_resource_permission(auth_token, datasource_id, action_payload)
        if response.response_code == constants.SUCCESS_STATUS_CODE:
            existing_permission = db_session.query(ResourcePermission).filter(
                and_(ResourcePermission.resource_id == resource_id,
                     ResourcePermission.datasource_id == datasource_id,
                     ResourcePermission.email == user_email)).first()
        else:
            print "Permission does not exist in db, so cannot update - Bad Request"
            return ResponseMessage(400, "Bad Request - Permission not found in records")

    elif not existing_permission:
        print "Permission does not exist in db, so cannot update - Bad Request"
        return ResponseMessage(400, "Bad Request - Permission not found in records")

    existing_permission.permission_type = new_permission_role

    if action_payload['key'] == action_constants.ActionNames.CHANGE_OWNER_OF_FILE or new_permission_role == constants.Role.OWNER:
        db_session.query(ResourcePermission).filter(and_(ResourcePermission.email == resource_owner,
                        ResourcePermission.resource_id == resource_id, ResourcePermission.datasource_id == datasource_id)).\
                          update({ResourcePermission.permission_type: constants.Role.WRITER})

        db_session.query(Resource).filter(and_(Resource.resource_id == resource_id, Resource.datasource_id == datasource_id,
                        Resource.resource_owner_id == resource_owner)).update({Resource.resource_owner_id: user_email,
                        Resource.last_modified_time: current_time,Resource.last_modifying_user_email: initiated_user})



    gsuite_action = actions.AddOrUpdatePermisssionForResource(auth_token, [existing_permission], resource_owner)

    existing_resource = db_session.query(Resource).filter(and_(Resource.resource_id == resource_id,
                                                               Resource.datasource_id == existing_permission.datasource_id)).first()
    if action_payload['key'] == action_constants.ActionNames.DELETE_PERMISSION_FOR_USER:
        updated_permissions = gsuite_action.delete_permissions()
        existing_resource = update_exposure_type_of_resource(db_session, existing_permission, existing_resource, action_payload['key'])
        existing_resource.last_modifying_user_email = initiated_user
        existing_resource.last_modified_time = current_time
    else:
        updated_permissions = gsuite_action.update_permissions()
        existing_resource.last_modifying_user_email = initiated_user
        existing_resource.last_modified_time = current_time

    if (not updated_permissions) or len(updated_permissions) < 1:
        return response_messages.ResponseMessage(400, 'Action failed with error - ' + gsuite_action.get_exception_message())

    if action_payload['key'] == action_constants.ActionNames.DELETE_PERMISSION_FOR_USER:
        db_session.delete(existing_permission)


    db_connection().commit()
    return response_messages.ResponseMessage(200, 'Action completed successfully')


def update_exposure_type_of_resource(db_session, existing_permission, existing_resource, action_type):

    if action_type == action_constants.ActionNames.DELETE_PERMISSION_FOR_USER:
        for perm in existing_resource.permissions:
            if perm.exposure_type == constants.ResourceExposureType.PUBLIC and perm.email != existing_permission.email:
                existing_resource.exposure_type == constants.ResourceExposureType.PUBLIC
            elif perm.exposure_type == constants.ResourceExposureType.EXTERNAL and perm.email != existing_permission.email:
                existing_resource.exposure_type == constants.ResourceExposureType.EXTERNAL
            elif perm.exposure_type == constants.ResourceExposureType.DOMAIN and perm.email != existing_permission.email:
                existing_resource.exposure_type == constants.ResourceExposureType.DOMAIN
            elif perm.exposure_type == constants.ResourceExposureType.INTERNAL and perm.email != existing_permission.email:
                existing_resource.exposure_type == constants.ResourceExposureType.INTERNAL
            else:
                existing_resource.exposure_type == constants.ResourceExposureType.PRIVATE

    else:
        # need to get domain id
        datasource = db_session.query(DataSource).filter(
            DataSource.datasource_id == existing_permission.datasource_id).first()

        resource_exposure_type = get_resource_exposure_type(db_session, datasource.domain_id, existing_permission.email, None,
                                   existing_resource.exposure_type)
        existing_resource.exposure_type = resource_exposure_type

    return existing_resource



def update_access_for_owned_files(auth_token, domain_id, datasource_id, user_email, initiated_by, removal_type):
    db_session = db_connection().get_session()
    #By default we remove all external access i.e. PUBLIC and EXTERNAL
    permission_type = [constants.ResourceExposureType.EXTERNAL, constants.ResourceExposureType.PUBLIC]
    #Other option is to also remove all access i.e. DOMAIN and INTERNAL also
    if not removal_type == constants.ResourceExposureType.EXTERNAL:
        permission_type.append(constants.ResourceExposureType.DOMAIN)
        permission_type.append(constants.ResourceExposureType.INTERNAL)

    shared_resources = db_session.query(Resource).filter(and_(Resource.datasource_id == datasource_id,
                            Resource.resource_owner_id == user_email, Resource.exposure_type.in_(permission_type))).all()

    permissions_to_update = []
    response_data = {}
    external_users = {}
    for resource in shared_resources:
        has_domain_sharing = False
        permission_changes = []
        for permission in resource.permissions:
            if permission.exposure_type in permission_type and permission.email != user_email:
                #Collect all external user emails, so that once permissions are removed, if their all access is removed, we need to remove from user table
                if permission.exposure_type == constants.ResourceExposureType.EXTERNAL and not permission.email in external_users:
                    external_users[permission.email] = 1
                permissions_to_update.append(permission)

            if permission.exposure_type == constants.ResourceExposureType.DOMAIN:
                has_domain_sharing = True


        #updating the exposure type in resource table
        #First case is that we are removing all permissions on a resource, so just set the exposure to PRIVATE
        if not removal_type == constants.ResourceExposureType.EXTERNAL:
            resource.exposure_type = constants.ResourceExposureType.PRIVATE
        else:
            # If we are removing only external permissions, then if any of the permissions had domain level sharing, set resource exposure to DOMAIN, else INTERNAL
            if has_domain_sharing:
                resource.exposure_type = constants.ResourceExposureType.DOMAIN
            else:
                resource.exposure_type = constants.ResourceExposureType.INTERNAL

    if len(permissions_to_update) > 0:
        gsuite_action = actions.AddOrUpdatePermisssionForResource(auth_token, permissions_to_update, user_email)
        updated_permissions = gsuite_action.delete_permissions()

        if len(updated_permissions) < 1:
            return response_messages.ResponseMessage(400, 'Action failed with error - ' + gsuite_action.get_exception_message())
        else:
            for updated_permission in updated_permissions:
                db_session.query(ResourcePermission).filter(and_(ResourcePermission.datasource_id == updated_permission.datasource_id,
                    ResourcePermission.resource_id == updated_permission.resource_id,
                    ResourcePermission.permission_id == updated_permission.permission_id)).delete()
                #db_session.delete(updated_permission)

            db_connection().commit()

            #Remove all external users who do not have any permissions now
            _remove_external_users_if_no_permissions(datasource_id, external_users, db_session)

            if len(updated_permissions) < len(permissions_to_update):
                return response_messages.ResponseMessage(400, 'Action executed partially - ' + gsuite_action.get_exception_message())
            else:
                return response_messages.ResponseMessage(200, 'Action completed successfully')
    return response_messages.ResponseMessage(400, "Bad Request - Nothing to update")

def _remove_external_users_if_no_permissions(datasource_id, external_users, db_session):
    anything_changed = False
    for external_user in external_users:
        permissions_count = db_session.query(ResourcePermission).filter(and_(ResourcePermission.datasource_id ==
                                                                 datasource_id, ResourcePermission.email == external_user)).count()
        if permissions_count < 1:
            db_session.query(DomainUser).filter(and_(DomainUser.email == external_user, DomainUser.datasource_id == datasource_id,
                                                         DomainUser.member_type == constants.UserMemberType.EXTERNAL)).delete()
            anything_changed = True

    if anything_changed:
        db_connection().commit()

def update_access_for_resource(auth_token, domain_id, datasource_id, resource_id, removal_type):
    db_session = db_connection().get_session()
    resource = db_session.query(Resource).filter(and_(Resource.datasource_id == datasource_id,Resource.resource_id == resource_id)).first()
    if not resource:
        return response_messages.ResponseMessage(400, "Bad Request - No such file found")

    permissions_to_update = []
    has_domain_sharing = False
    external_users = {}
    for permission in resource.permissions:
        if removal_type == constants.ResourceExposureType.EXTERNAL:
            #Collect all external user emails, so that once permissions are removed, if their all access is removed, we need to remove from user table
            if permission.exposure_type == constants.ResourceExposureType.EXTERNAL and not permission.email in external_users:
                external_users[permission.email] = 1

            if permission.exposure_type == constants.ResourceExposureType.EXTERNAL or permission.exposure_type == constants.ResourceExposureType.PUBLIC:
                permissions_to_update.append(permission)
            elif permission.exposure_type == constants.ResourceExposureType.DOMAIN:
                has_domain_sharing = True

        else:
            if permission.permission_type != 'owner':
                permissions_to_update.append(permission)

    if len(permissions_to_update) > 0 and removal_type == constants.ResourceExposureType.EXTERNAL:
        if has_domain_sharing:
            resource.exposure_type = constants.ResourceExposureType.DOMAIN
        else:
            resource.exposure_type = constants.ResourceExposureType.INTERNAL
    else:
        resource.exposure_type = constants.ResourceExposureType.PRIVATE

    if len(permissions_to_update) > 0:
        gsuite_action = actions.AddOrUpdatePermisssionForResource(auth_token, permissions_to_update, resource.resource_owner_id)
        updated_permissions = gsuite_action.delete_permissions()

        if len(updated_permissions) < 1:
            return response_messages.ResponseMessage(400, 'Action failed with error - ' + gsuite_action.get_exception_message())
        else:
            for updated_permission in updated_permissions:
                db_session.query(ResourcePermission).filter(and_(ResourcePermission.datasource_id == updated_permission.datasource_id,
                    ResourcePermission.resource_id == updated_permission.resource_id,
                    ResourcePermission.permission_id == updated_permission.permission_id)).delete()
                #db_session.delete(updated_permission)
            db_connection().commit()

            #Remove all external users who do not have any permissions now
            _remove_external_users_if_no_permissions(datasource_id, external_users, db_session)

            if len(updated_permissions) < len(permissions_to_update):
                return response_messages.ResponseMessage(400, 'Action executed partially - ' + gsuite_action.get_exception_message())
            else:
                return response_messages.ResponseMessage(200, 'Action completed successfully')
    return response_messages.ResponseMessage(400, "Bad Request - Nothing to update")


def remove_all_permissions_for_user(auth_token, domain_id, datasource_id, user_email, initiated_by):
    db_session = db_connection().get_session()
    resource_permissions = db_session.query(ResourcePermission).filter(and_(ResourcePermission.datasource_id ==
                                                                 datasource_id, ResourcePermission.email == user_email,
                                                                 ResourcePermission.permission_type != "owner")).all()
    permissions_to_update = []
    for permission in resource_permissions:
        permissions_to_update.append(permission)

    if len(permissions_to_update) > 0:
        gsuite_action = actions.AddOrUpdatePermisssionForResource(auth_token, permissions_to_update, initiated_by)
        updated_permissions = gsuite_action.delete_permissions()

        if len(updated_permissions) < 1:
            return response_messages.ResponseMessage(400, 'Action failed with error - ' + gsuite_action.get_exception_message())
        else:
            for updated_permission in updated_permissions:
                db_session.delete(updated_permission)
            if len(updated_permissions) == len(permissions_to_update):
                db_session.query(DomainUser).filter(and_(DomainUser.email == user_email, DomainUser.datasource_id == datasource_id,
                                                         DomainUser.member_type == constants.UserMemberType.EXTERNAL)).delete()
            db_connection().commit()
            if len(updated_permissions) < len(permissions_to_update):
                return response_messages.ResponseMessage(400, 'Action executed partially - ' + gsuite_action.get_exception_message())
            else:
                return response_messages.ResponseMessage(200, 'Action completed successfully')
    return response_messages.ResponseMessage(400, "Bad Request - Nothing to update")


def modify_group_membership(auth_token, datasource_id, action_name, action_parameters):
    user_email = action_parameters["user_email"]
    group_email = action_parameters["group_email"]
    db_session = db_connection().get_session()
    if action_name == action_constants.ActionNames.REMOVE_USER_FROM_GROUP:
        response = actions.delete_user_from_group(auth_token, group_email, user_email)
        if ResponseType.ERROR in response:
            return response_messages.ResponseMessage(response.resp.status,'Action failed with error - ' + response['error']['message'])
        db_session.query(DirectoryStructure).filter(and_(DirectoryStructure.datasource_id == datasource_id,
                                                            DirectoryStructure.parent_email == group_email, DirectoryStructure.member_email == user_email)).delete()
    elif action_name == action_constants.ActionNames.ADD_USER_TO_GROUP:
        response = actions.add_user_to_group(auth_token, group_email, user_email)
        if ResponseType.ERROR in response:
            return response_messages.ResponseMessage(response.resp.status,'Action failed with error - ' + response['error']['message'])
        dirstructure = DirectoryStructure()
        dirstructure.datasource_id = datasource_id
        dirstructure.member_email = user_email
        dirstructure.parent_email = group_email
        dirstructure.member_type = response['type']
        dirstructure.member_role = response['role']
        dirstructure.member_id = response['id']
        db_session.add(dirstructure)

    db_connection().commit()
    return response_messages.ResponseMessage(200, "Action completed successfully")


def execute_action(auth_token, domain_id, datasource_id, action_config, action_payload):
    action_parameters = action_payload['parameters']

    #Watch report action
    if action_config.key == action_constants.ActionNames.WATCH_ALL_ACTION_FOR_USER:
        return create_watch_report(auth_token, datasource_id, action_payload)

    #Directory change actions
    elif action_config.key == action_constants.ActionNames.REMOVE_USER_FROM_GROUP or action_config.key == action_constants.ActionNames.ADD_USER_TO_GROUP:
        return modify_group_membership(auth_token, datasource_id, action_config.key, action_parameters)

    #Transfer ownership action
    elif action_config.key == action_constants.ActionNames.TRANSFER_OWNERSHIP:
        old_owner_email = action_parameters["old_owner_email"]
        new_owner_email = action_parameters["new_owner_email"]
        response = actions.transfer_ownership(auth_token, old_owner_email, new_owner_email)
        return response_messages.ResponseMessage(202, "Action submitted successfully")

    #Bulk permission change actions for user
    elif action_config.key == action_constants.ActionNames.MAKE_ALL_FILES_PRIVATE:
        user_email = action_parameters['user_email']
        initiated_by = action_payload['initiated_by']
        return update_access_for_owned_files(auth_token, domain_id, datasource_id, user_email, initiated_by, "ALL")
    elif action_config.key == action_constants.ActionNames.REMOVE_EXTERNAL_ACCESS:
        user_email = action_parameters['user_email']
        initiated_by = action_payload['initiated_by']
        return update_access_for_owned_files(auth_token, domain_id, datasource_id, user_email, initiated_by, constants.ResourceExposureType.EXTERNAL)
    elif action_config.key == action_constants.ActionNames.REMOVE_ALL_ACCESS_FOR_USER:
        user_email = action_parameters['user_email']
        initiated_by = action_payload['initiated_by']
        return remove_all_permissions_for_user(auth_token, domain_id, datasource_id, user_email, initiated_by)

    #Bulk permission change actions for resource
    elif action_config.key == action_constants.ActionNames.MAKE_RESOURCE_PRIVATE:
        resource_id = action_parameters['resource_id']
        return update_access_for_resource(auth_token, domain_id, datasource_id, resource_id, 'ALL')
    elif action_config.key == action_constants.ActionNames.REMOVE_EXTERNAL_ACCESS_TO_RESOURCE:
        resource_id = action_parameters['resource_id']
        return update_access_for_resource(auth_token, domain_id, datasource_id, resource_id, constants.ResourceExposureType.EXTERNAL)


    #Single Resource permission change actions
    elif action_config.key == action_constants.ActionNames.UPDATE_PERMISSION_FOR_USER:
        return update_or_delete_resource_permission(auth_token, datasource_id, action_payload)
    elif action_config.key == action_constants.ActionNames.DELETE_PERMISSION_FOR_USER:
        action_parameters['new_permission_role'] = ''
        return update_or_delete_resource_permission(auth_token, datasource_id, action_payload)
    elif action_config.key == action_constants.ActionNames.ADD_PERMISSION_FOR_A_FILE:
        return add_resource_permission(auth_token, datasource_id, action_payload)
    elif action_config.key == action_constants.ActionNames.CHANGE_OWNER_OF_FILE:
        action_parameters['new_permission_role'] = constants.Role.OWNER
        action_parameters['resource_owner_id'] = action_parameters["old_owner_email"]
        action_parameters['user_email'] = action_parameters["new_owner_email"]
        return update_or_delete_resource_permission(auth_token, datasource_id, action_payload)

def validate_action_parameters(action_config, action_parameters):
    config_params = action_config.parameters
    for param in config_params:
        key = param['key']
        if key not in action_parameters:
            return False
    return True

def audit_action(domain_id, datasource_id, initiated_by, action_to_take, action_parameters):
    db_session = db_connection().get_session()
    try:
        audit_log_entries = []

        log_entry = {"domain_id": domain_id,
                     "datasource_id": datasource_id,
                     "initiated_by": initiated_by,
                     "action_name": action_to_take,
                     "parameters": json.dumps(action_parameters),
                     "timestamp": str(datetime.utcnow().isoformat()),
                     "affected_entity": "",
                     "affected_entity_type": ""
                     }
        if action_to_take == action_constants.ActionNames.ADD_USER_TO_GROUP:
            log_entry['affected_entity'] = action_parameters['user_email']
            log_entry['affected_entity_type'] = "User"
        elif action_to_take == action_constants.ActionNames.REMOVE_USER_FROM_GROUP:
            log_entry['affected_entity'] = action_parameters['user_email']
            log_entry['affected_entity_type'] = "User"
        elif action_to_take == action_constants.ActionNames.TRANSFER_OWNERSHIP:
            log_entry['affected_entity'] = action_parameters['old_owner_email']
            log_entry['affected_entity_type'] = "User"
        elif action_to_take == action_constants.ActionNames.CHANGE_OWNER_OF_FILE:
            log_entry['affected_entity'] = action_parameters['old_owner_email']
            log_entry['affected_entity_type'] = "User"
        elif action_to_take == action_constants.ActionNames.MAKE_RESOURCE_PRIVATE:
            log_entry['affected_entity'] = action_parameters['resource_id']
            log_entry['affected_entity_type'] = "Resource"
        elif action_to_take == action_constants.ActionNames.MAKE_ALL_FILES_PRIVATE:
            log_entry['affected_entity'] = action_parameters['user_email']
            log_entry['affected_entity_type'] = "User"
        elif action_to_take == action_constants.ActionNames.REMOVE_EXTERNAL_ACCESS_TO_RESOURCE:
            log_entry['affected_entity'] = action_parameters['resource_id']
            log_entry['affected_entity_type'] = "Resource"
        elif action_to_take == action_constants.ActionNames.REMOVE_EXTERNAL_ACCESS:
            log_entry['affected_entity'] = action_parameters['user_email']
            log_entry['affected_entity_type'] = "User"
        elif action_to_take == action_constants.ActionNames.UPDATE_PERMISSION_FOR_USER:
            log_entry['affected_entity'] = action_parameters['user_email']
            log_entry['affected_entity_type'] = "User"
        elif action_to_take == action_constants.ActionNames.DELETE_PERMISSION_FOR_USER:
            log_entry['affected_entity'] = action_parameters['user_email']
            log_entry['affected_entity_type'] = "User"
        elif action_to_take == action_constants.ActionNames.REMOVE_ALL_ACCESS_FOR_USER:
            log_entry['affected_entity'] = action_parameters['user_email']
            log_entry['affected_entity_type'] = "User"
        elif action_to_take == action_constants.ActionNames.WATCH_ALL_ACTION_FOR_USER:
            log_entry['affected_entity'] = action_parameters['user_email']
            log_entry['affected_entity_type'] = "User"

        audit_log_entries.append(log_entry)

        db_session.bulk_insert_mappings(AuditLog, audit_log_entries)
        db_connection().commit()

    except Exception as e:
        print e
        print "Exception occurred while processing audit log for domain: ", domain_id, " and datasource_id: ", datasource_id, " and initiated_by: ", initiated_by


def revoke_user_app_access(auth_token, datasource_id, user_email, client_id):
    try:
        driectory_service = gutils.get_directory_service(auth_token)
        driectory_service.tokens().delete(userKey=user_email, clientId=client_id).execute()
        db_session = db_connection().get_session()
        db_session.query(ApplicationUserAssociation).filter(and_(ApplicationUserAssociation.datasource_id == datasource_id,
                                                                 ApplicationUserAssociation.user_email == user_email,
                                                                 ApplicationUserAssociation.client_id == client_id)).delete()

        # check if app is associated with any user
        app_user_association = db_session.query(ApplicationUserAssociation).filter(and_(ApplicationUserAssociation.datasource_id == datasource_id,
                                                                 ApplicationUserAssociation.client_id == client_id)).count()

        # if no user is associated with app, than remove the app also
        if app_user_association < 1:
            db_session.query(Application).filter(and_(Application.datasource_id == datasource_id, Application.client_id == client_id)).delete()

        db_connection().commit()
        return True
    except Exception as ex:
        print ex
        print "Exception occurred while deleting app for datasource_id: ", datasource_id, " and user_email: ", user_email
        return False

