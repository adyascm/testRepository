from adya.common import constants, action_constants, errormessage, messaging
from adya.datasources.google import actions, gutils
from adya.db.models import AuditLog, Action, Application,ApplicationUserAssociation
from adya.db.connection import db_connection
from sqlalchemy import and_
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
                                                    "Transfers all files owned by one user to some other specified user",
                                                    [{"key": "old_owner_email", "label": "Old User", "editable": 0},
                                                    {"key": "new_owner_email", "label": "New User", "editable": 1}],
                                                    True)

    changeOwnerOfFileAction = instantiate_action("GSUITE", action_constants.ActionNames.CHANGE_OWNER_OF_FILE,
                                                    "Change Owner",
                                                    "Transfers single file owned by one user to some other specified user",
                                                    [{"key": "resource_id", "label": "For resource", "editable": 0,
                                                    "hidden": 1},
                                                    {"key": "resource_name", "label": "For resource", "editable": 0},
                                                    {"key": "old_owner_email", "label": "Old User", "editable": 0},
                                                    {"key": "new_owner_email", "label": "New User", "editable": 1}],
                                                    False)

    removeExternalAccessAction = instantiate_action("GSUITE", action_constants.ActionNames.REMOVE_EXTERNAL_ACCESS,
                                                    "Remove external access",
                                                    "Remove external access for all files owned by user",
                                                    [{"key": "user_email", "label": "For user", "editable": 0}],
                                                    False)

    removeExternalAccessToResourceAction = instantiate_action("GSUITE",
                                                                action_constants.ActionNames.REMOVE_EXTERNAL_ACCESS_TO_RESOURCE,
                                                                "Remove external access of file",
                                                                "Remove all external access for the given resource",
                                                                [{"key": "resource_id", "label": "For resource",
                                                                "editable": 0, "hidden": 1},
                                                                {"key": "resource_name", "label": "For resource",
                                                                "editable": 0}], False)

    makeAllFilesPrivateAction = instantiate_action("GSUITE", action_constants.ActionNames.MAKE_ALL_FILES_PRIVATE,
                                                    "Remove all sharing",
                                                    "Make all files owned by user to private",
                                                    [{"key": "user_email", "label": "For user", "editable": 0}],
                                                    False)

    makeResourcePrivateAction = instantiate_action("GSUITE", action_constants.ActionNames.MAKE_RESOURCE_PRIVATE,
                                                    "Remove all sharing of file",
                                                    "Remove all sharing on a given resource",
                                                    [{"key": "resource_id", "label": "For resource", "editable": 0,
                                                        "hidden": 1},
                                                    {"key": "resource_name", "label": "For resource",
                                                        "editable": 0}], False)

    deletePermissionForUserAction = instantiate_action("GSUITE",
                                                        action_constants.ActionNames.DELETE_PERMISSION_FOR_USER,
                                                        "Remove permission for user",
                                                        "Remove access granted to a user for a resource",
                                                        [{"key": "resource_id", "label": "For resource",
                                                            "editable": 0, "hidden": 1},
                                                        {"key": "resource_name", "label": "For resource",
                                                            "editable": 0},
                                                        {"key": "resource_owner_id", "label": "Owner of file",
                                                            "editable": 0},
                                                        {"key": "user_email", "label": "For User", "editable": 0}],
                                                        False)

    updatePermissionForUserAction = instantiate_action("GSUITE",
                                                        action_constants.ActionNames.UPDATE_PERMISSION_FOR_USER,
                                                        "Change permission for user",
                                                        "Update the permission granted to a user for a resource",
                                                        [{"key": "resource_id", "label": "For resource",
                                                            "editable": 0, "hidden": 1},
                                                        {"key": "resource_name", "label": "For resource",
                                                            "editable": 0},
                                                        {"key": "resource_owner_id", "label": "Owner of file",
                                                            "editable": 0},
                                                        {"key": "user_email", "label": "For User", "editable": 0},
                                                        {"key": "new_permission_role", "label": "New permission",
                                                            "editable": 1}], False)

    watchActionForUser = instantiate_action("GSUITE", action_constants.ActionNames.WATCH_ALL_ACTION_FOR_USER,
                                            "Watch all my actions",
                                            "Watch Action for a user",
                                            [{"key": "user_email", "label": "For user", "editable": 0}], False)

    watchActionForResource = instantiate_action("GSUITE",
                                                action_constants.ActionNames.WATCH_ALL_ACTION_FOR_RESOURCE,
                                                "Watch all my actions",
                                                "Watch Action for a resource",
                                                [{"key": "resource_id", "label": "For resource", "editable": 0,
                                                    "hidden": 1},
                                                    {"key": "resource_name", "label": "For resource",
                                                    "editable": 0}
                                                    ], False)

    removeAllAction = instantiate_action("GSUITE" , action_constants.ActionNames.REMOVE_ALL_ACCESS_FOR_USER, "Remove all Access ",
                                        "Remove all Access for a user", [{"key": "user_email", "label": "For user", "editable": 0}],
                                            False)

    removeUserFromGroup = instantiate_action("GSUITE", action_constants.ActionNames.REMOVE_USER_FROM_GROUP, "Remove User",
                                             "Remove user from a group", [{"key": "user_email", "label": "For user", "editable": 0},
                                                                          {"key": "group_email", "label": "For Group", "editable": 0}], False)

    addUserToGroup = instantiate_action("GSUITE", action_constants.ActionNames.ADD_USER_TO_GROUP, "Add User",
                                             "Add user to a group", [{"key": "user_email", "label": "For user", "editable": 0},
                                                                     {"key": "group_email", "label": "For Group",
                                                                      "editable": 0}], False)

    actions = [transferOwnershipAction,
                changeOwnerOfFileAction,
                deletePermissionForUserAction,
                makeAllFilesPrivateAction,
                makeResourcePrivateAction,
                removeExternalAccessAction,
                removeExternalAccessToResourceAction,
                updatePermissionForUserAction,
                watchActionForUser,
                watchActionForResource,
                removeAllAction,
                removeUserFromGroup,
                addUserToGroup
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
    try:
        actions_list = get_actions()
        for action in actions_list:
            if action.key == action_to_take:
                return action

        return errormessage.UNKNOWN_ACTION

    except Exception as e:
        print e
        print "Exception occurred while getting action, ", action_to_take


def initiate_action(auth_token, domain_id, datasource_id, action_payload):
    try:
        action_to_take = action_payload['key']
        initiated_by = action_payload['initiated_by']
        action_parameters = action_payload['parameters']

        action_config = get_action(action_to_take)

        isOkay = validate_action_parameters(action_config, action_parameters)

        if isOkay == True:
            print "Parameter validation for action ", action_to_take, " is successful."
        else:
            return "Parameter validation for action ", action_to_take, " failed."

        print "Initiating action: ", action_to_take, " with parameters: ", action_payload
        execution_status = execute_action(
            auth_token, domain_id, datasource_id, action_config, action_payload)
        if execution_status == errormessage.ACTION_EXECUTION_SUCCESS:
            return audit_action(domain_id, datasource_id, initiated_by, action_to_take, action_parameters)
        else:
            return "Failed to execute action"

    except Exception as e:
        print e
        print "Exception occurred while initiating action using payload ", action_payload, " on domain: ", domain_id, " and datasource: ", datasource_id
        return "Failed to execute action"


def execute_action(auth_token, domain_id, datasource_id, action_config, action_payload):
    try:
        response = ""
        action_parameters = action_payload['parameters']
        if action_config.key == action_constants.ActionNames.WATCH_ALL_ACTION_FOR_USER :
            form_input = {}
            form_input['name'] = "watch activity for " + str(action_parameters['user_email'])
            form_input['description'] = "watch activity for " + str(action_parameters['user_email'])
            form_input['frequency'] = "cron(0 9 ? * 2 *)"
            form_input['receivers'] = action_payload['initiated_by']
            form_input['report_type'] = "Activity"
            form_input['selected_entity_type'] = "user"
            form_input['selected_entity'] = action_parameters['user_email']
            form_input['selected_entity_name'] = action_parameters['user_email']
            form_input['is_active'] = 0
            form_input['datasource_id'] = datasource_id
            messaging.trigger_post_event(constants.GET_SCHEDULED_RESOURCE_PATH, auth_token, None, form_input)

        elif action_config.key == action_constants.ActionNames.REMOVE_USER_FROM_GROUP:
            user_email = action_parameters["user_email"]
            group_email = action_parameters["group_email"]
            response = actions.delete_user_from_group(auth_token, group_email, user_email)
        elif action_config.key == action_constants.ActionNames.ADD_USER_TO_GROUP:
            user_email = action_parameters["user_email"]
            group_email = action_parameters["group_email"]
            response = actions.add_user_to_group(auth_token, group_email, user_email)
        elif action_config.key == action_constants.ActionNames.TRANSFER_OWNERSHIP:
            old_owner_email = action_parameters["old_owner_email"]
            new_owner_email = action_parameters["new_owner_email"]
            response = actions.transfer_ownership(
                auth_token, domain_id, old_owner_email, new_owner_email)
        elif action_config.key == action_constants.ActionNames.CHANGE_OWNER_OF_FILE:
            old_owner_email = action_parameters["old_owner_email"]
            new_owner_email = action_parameters["new_owner_email"]
            resource_id = action_parameters["resource_id"]
            response = actions.transfer_ownership_of_resource(
                auth_token, domain_id, datasource_id,resource_id, old_owner_email, new_owner_email)
        elif action_config.key == action_constants.ActionNames.MAKE_RESOURCE_PRIVATE:
            resource_id = action_parameters['resource_id']
            response = actions.make_resource_private(
                auth_token, domain_id, datasource_id, resource_id)
        elif action_config.key == action_constants.ActionNames.MAKE_ALL_FILES_PRIVATE:
            user_email = action_parameters['user_email']
            response = actions.make_all_files_owned_by_user_private(
                auth_token, domain_id, datasource_id, user_email)
        elif action_config.key == action_constants.ActionNames.REMOVE_EXTERNAL_ACCESS_TO_RESOURCE:
            resource_id = action_parameters['resource_id']
            response = actions.remove_external_access_to_resource(
                auth_token, domain_id, datasource_id, resource_id)
        elif action_config.key == action_constants.ActionNames.REMOVE_EXTERNAL_ACCESS:
            user_email = action_parameters['user_email']
            response = actions.remove_external_access_for_all_files_owned_by_user(
                auth_token, domain_id, datasource_id, user_email)
        elif action_config.key == action_constants.ActionNames.UPDATE_PERMISSION_FOR_USER:
            user_email = action_parameters['user_email']
            resource_id = action_parameters['resource_id']
            resource_owner = action_parameters['resource_owner_id']
            new_permission_role = action_parameters['new_permission_role']
            response = actions.update_permissions_of_user_to_resource(auth_token, domain_id, datasource_id,
                                                                      resource_id, user_email, new_permission_role,
                                                                      resource_owner)
        elif action_config.key == action_constants.ActionNames.DELETE_PERMISSION_FOR_USER:
            user_email = action_parameters['user_email']
            resource_id = action_parameters['resource_id']
            resource_owner = action_parameters['resource_owner_id']
            new_permission_role = ''
            response = actions.update_permissions_of_user_to_resource(auth_token, domain_id, datasource_id,
                                                                      resource_id, user_email, new_permission_role,
                                                                      resource_owner)
        elif action_config.key == action_constants.ActionNames.REMOVE_ALL_ACCESS_FOR_USER:
            user_email = action_parameters['user_email']
            response = actions.remove_all_access_for_user(auth_token, domain_id, datasource_id, user_email)

        # check response and return success/failure
        return errormessage.ACTION_EXECUTION_SUCCESS

    except Exception as e:
        print e
        print "Exception occurred while executing action ", action_config.name, " using parameters: ", action_parameters


def validate_action_parameters(action_config, action_parameters):
    try:
        config_params = action_config.parameters
        for param in config_params:
            key = param['key']
            if key not in action_parameters:
                return False
        return True

    except Exception as e:
        print e
        print "Exception occurred while validating action, ", action_config.name, " with parameters: ", action_parameters


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
        
        if action_to_take == action_constants.ActionNames.TRANSFER_OWNERSHIP:
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
        db_session.commit()

        return errormessage.ACTION_EXECUTION_SUCCESS

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
        db_session.commit()
    except Exception as ex:
        print ex
        print "Exception occurred while processing audit log for domain: ", domain_id, " and datasource_id: ", datasource_id
