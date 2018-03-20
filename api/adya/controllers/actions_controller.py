from adya.common import constants, action_constants, messaging, response_messages
from adya.common.constants import ResponseType
from adya.datasources.google import actions, gutils
from adya.db.models import AuditLog, Action, Application, ApplicationUserAssociation, ResourcePermission, Resource, \
    DirectoryStructure
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
                                                 "Transfers all documents owned by one user to another user",
                                                 [{"key": "old_owner_email", "label": "Old User", "editable": 0},
                                                     {"key": "new_owner_email", "label": "New User", "editable": 1}],
                                                 True)

    changeOwnerOfFileAction = instantiate_action("GSUITE", action_constants.ActionNames.CHANGE_OWNER_OF_FILE,
                                                 "Change Owner",
                                                 "Change owner of the selected document",
                                                 [{"key": "resource_id", "label": "Selected document", "editable": 0, "hidden": 1},
                                                {"key": "resource_name", "label": "Selected document", "editable": 0},
                                                {"key": "old_owner_email", "label": "Old User", "editable": 0},
                                                {"key": "new_owner_email", "label": "New User", "editable": 1}],
                                                 False)

    removeExternalAccessAction = instantiate_action("GSUITE", action_constants.ActionNames.REMOVE_EXTERNAL_ACCESS,
                                                    "Remove external sharing",
                                                    "Remove external sharing for all documents owned by this user",
                                                    [{"key": "user_email", "label": "For user", "editable": 0}],
                                                    False)

    removeExternalAccessToResourceAction = instantiate_action("GSUITE",
                                                              action_constants.ActionNames.REMOVE_EXTERNAL_ACCESS_TO_RESOURCE,
                                                              "Remove external sharing",
                                                              "Remove external sharing for the selected document",
                                                              [{"key": "resource_id", "label": "Selected document", "editable": 0, "hidden": 1},
                                                               {"key": "resource_name", "label": "Selected document", "editable": 0}], False)

    makeAllFilesPrivateAction = instantiate_action("GSUITE", action_constants.ActionNames.MAKE_ALL_FILES_PRIVATE,
                                                   "Remove all sharing",
                                                   "Remove all sharing for documents owned by selected user",
                                                   [{"key": "user_email", "label": "For user", "editable": 0}],
                                                   False)

    makeResourcePrivateAction = instantiate_action("GSUITE", action_constants.ActionNames.MAKE_RESOURCE_PRIVATE,
                                                   "Remove all sharing",
                                                   "Remove all sharing for selected document",
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
                                                       "Change permission for selected document for user",
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
                                            "Watch all activities for selected user",
                                            [{"key": "user_email", "label": "For user", "editable": 0}], False)

    removeAllAction = instantiate_action("GSUITE", action_constants.ActionNames.REMOVE_ALL_ACCESS_FOR_USER, 
                                        "Remove sharing",
                                         "Remove all sharing with selected user", [
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
    messaging.trigger_post_event(constants.GET_SCHEDULED_RESOURCE_PATH, auth_token, None, form_input)
    return ResponseMessage(201, "Watch report created for {}".format(user_email))

def add_resource_permission(auth_token, datasource_id, action_payload):
    action_parameters = action_payload['parameters']
    new_permission_role = action_parameters['new_permission_role']
    user_type = action_parameters['user_type'] if 'user_type' in action_parameters else 'user'
    resource_id = action_parameters['resource_id']
    resource_owner = action_parameters['resource_owner_id']

    permission = {}
    permission.datasource_id = datasource_id
    permission.resource_id = resource_id
    permission.email = action_parameters['user_email']
    permission.permission_type = new_permission_role
    gsuite_action = actions.AddOrUpdatePermisssionForResource(auth_token, [existing_permission], resource_owner)
    return gsuite_action.add_permissions()

def update_or_delete_resource_permission(auth_token, datasource_id, action_payload):
    action_parameters = action_payload['parameters']
    new_permission_role = action_parameters['new_permission_role']
    user_type = action_parameters['user_type'] if 'user_type' in action_parameters else 'user'
    resource_id = action_parameters['resource_id']
    resource_owner = action_parameters['resource_owner_id']
    user_email = action_parameters['user_email']
    db_session = db_connection().get_session()
    existing_permission = db_session.query(ResourcePermission).filter(
                        and_(ResourcePermission.resource_id == resource_id,
                            ResourcePermission.datasource_id == datasource_id,
                            ResourcePermission.email == user_email)).first()
    if not existing_permission:
        print "Permission does not exist in db, so cannot update - Bad Request"
        return ResponseMessage(400, "Bad Request - Permission not found in records")

    existing_permission.permission_type = new_permission_role
    if action_payload['key'] == action_constants.ActionNames.CHANGE_OWNER_OF_FILE:
        resource_owner = action_parameters['old_owner_email']
    gsuite_action = actions.AddOrUpdatePermisssionForResource(auth_token, [existing_permission], resource_owner)
    if action_payload['key'] == action_constants.ActionNames.DELETE_PERMISSION_FOR_USER:
        updated_permissions = gsuite_action.delete_permissions()
    else:
        updated_permissions =  gsuite_action.update_permissions()

    if len(updated_permissions) < 1:
        return response_messages.ResponseMessage(400, 'Action failed with error - ' + gsuite_action.get_exception_message())

    if action_payload['key'] == action_constants.ActionNames.DELETE_PERMISSION_FOR_USER:
        db_session.delete(existing_permission)
    db_connection().commit()
    return response_messages.ResponseMessage(200, 'Action completed successfully')
    

def update_access_for_owned_files(auth_token, domain_id, datasource_id, user_email, initiated_by, removal_type):
    db_session = db_connection().get_session()
    permission_type = [constants.ResourceExposureType.EXTERNAL, constants.ResourceExposureType.PUBLIC]
    if not removal_type == constants.ResourceExposureType.EXTERNAL:
        permission_type.append(constants.ResourceExposureType.DOMAIN)

    shared_resources = db_session.query(Resource).filter(and_(Resource.datasource_id == datasource_id,
                            Resource.resource_owner_id == user_email, Resource.exposure_type.in_(permission_type))).all()
    
    permissions_to_update = []
    response_data = {}
    for resource in shared_resources:
        permission_changes = []
        for permission in resource.permissions:
            if permission.exposure_type in permission_type and permission.email != user_email:
                permissions_to_update.append(permission)

    if len(permissions_to_update) > 0:
        resource_actions_handler = actions.AddOrUpdatePermisssionForResource(auth_token, permissions_to_update, initiated_by)
        updated_permissions = resource_actions_handler.delete_permissions()
        
        if len(updated_permissions) < 1:
            return response_messages.ResponseMessage(400, 'Action failed with error - ' + gsuite_action.get_exception_message())
        else:
            for updated_permission in updated_permissions:
                db_session.delete(updated_permission)
            db_connection().commit()
            if len(updated_permissions) < len(permissions_to_update):
                return response_messages.ResponseMessage(400, 'Action executed partially - ' + gsuite_action.get_exception_message())
            else:
                return response_messages.ResponseMessage(200, 'Action completed successfully')
    return response_messages.ResponseMessage(400, "Bad Request - Nothing to update")

def update_access_for_resource(auth_token, domain_id, datasource_id, resource_id, removal_type):
    db_session = db_connection().get_session()
    resource = db_session.query(Resource).filter(and_(Resource.datasource_id == datasource_id,Resource.resource_id == resource_id)).first()
    if not resource:
        return response_messages.ResponseMessage(400, "Bad Request - No such file found")

    permissions_to_update = []
    for permission in resource.permissions:
        if removal_type == constants.ResourceExposureType.EXTERNAL:
            if permission.exposure_type == constants.ResourceExposureType.EXTERNAL or permission.exposure_type == constants.ResourceExposureType.PUBLIC:
                permissions_to_update.append(permission)
        else:
            if permission.permission_type != 'owner':
                permissions_to_update.append(permission)
        
    if len(permissions_to_update) > 0:
        resource_actions_handler = actions.AddOrUpdatePermisssionForResource(auth_token, permissions_to_update, resource.resource_owner_id)
        updated_permissions = resource_actions_handler.delete_permissions()
        
        if len(updated_permissions) < 1:
            return response_messages.ResponseMessage(400, 'Action failed with error - ' + gsuite_action.get_exception_message())
        else:
            for updated_permission in updated_permissions:
                db_session.delete(updated_permission)
            db_connection().commit()
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
        resource_actions_handler = actions.AddOrUpdatePermisssionForResource(auth_token, permissions_to_update, initiated_by)
        updated_permissions = resource_actions_handler.delete_permissions()
        
        if len(updated_permissions) < 1:
            return response_messages.ResponseMessage(400, 'Action failed with error - ' + gsuite_action.get_exception_message())
        else:
            for updated_permission in updated_permissions:
                db_session.delete(updated_permission)
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


def revoke_user_app_access(auth_token, domain_id, datasource_id, user_email, client_id):
    try:
        driectory_service = gutils.get_directory_service(auth_token)
        driectory_service.tokens().delete(userKey=user_email, clientId=client_id).execute()
        db_session = db_connection().get_session()
        db_session.query(ApplicationUserAssociation).filter(and_(ApplicationUserAssociation.datasource_id == datasource_id,
                                                                 ApplicationUserAssociation.user_email == user_email,
                                                                 ApplicationUserAssociation.client_id == client_id)).delete()
        db_connection().commit()
    except Exception as ex:
        print ex
        print "Exception occurred while deleting app for domain: ", domain_id, " and datasource_id: ", datasource_id, " and user_email: ", user_email
