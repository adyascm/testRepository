from adya.common import constants, action_constants, errormessage
from adya.datasources.google import actions,gutils
from adya.db.models import AuditLog, Action,Application
from adya.db.connection import db_connection
from sqlalchemy import and_
import json
from datetime import datetime


def get_actions():
    try:

        #if not datasource_type:
        #    return "Please pass a valid datasource_type in order to get all the actions enabled for it."
        #db_session = db_connection().get_session()
        #actions = db_session.query(Action).filter(Action.datasource_type == datasource_type).all()

        #if not actions:
         #   raise Exception("Couldn't fetch actions")
        #elif len(actions) == 0:
         #   raise Exception("No actions defined for datasource_type: " + datasource_type)
        transferOwnershipAction = instantiate_action("GSUITE", action_constants.ActionNames.TRANSFER_OWNERSHIP,
                                         "Transfers all files owned by one user to some other specified user",
                                         {"old_owner_email": "", "new_owner_email": ""}, True)

        changeOwnerOfFileAction = instantiate_action("GSUITE", action_constants.ActionNames.CHANGE_OWNER_OF_FILE,
                                         "Transfers single file owned by one user to some other specified user",
                                         {"resource_id": "", "old_owner_email": "", "new_owner_email": ""}, False)

        removeExternalAccessAction = instantiate_action("GSUITE", action_constants.ActionNames.REMOVE_EXTERNAL_ACCESS,
                                            "Remove external access for all files owned by user",
                                            {"user_email": ""}, False)

        removeExternalAccessToResourceAction = instantiate_action("GSUITE", action_constants.ActionNames.REMOVE_EXTERNAL_ACCESS_TO_RESOURCE,
                                                      "Remove all external access for the given resource",
                                                      {"resource_id": ""}, False)

        makeAllFilesPrivateAction = instantiate_action("GSUITE", action_constants.ActionNames.MAKE_ALL_FILES_PRIVATE,
                                           "Make all files owned by user to private",
                                           {"user_email": ""}, False)

        makeResourcePrivateAction = instantiate_action("GSUITE", action_constants.ActionNames.MAKE_RESOURCE_PRIVATE,
                                           "Remove all sharing on a given resource",
                                           {"resource_id": ""}, False)

        deletePermissionForUserAction = instantiate_action("GSUITE", action_constants.ActionNames.DELETE_PERMISSION_FOR_USER,
                                               "Remove access granted to a user for a resource",
                                               {"user_email": "", "resource_owner_id": "", "resource_id": ""}, False)

        updatePermissionForUserAction = instantiate_action("GSUITE", action_constants.ActionNames.UPDATE_PERMISSION_FOR_USER,
                                               "Update the permission granted to a user for a resource",
                                               {"user_email": "", "resource_owner_id": "", "resource_id": "",
                                                "new_permission_role": ""}, False)

        actions = [transferOwnershipAction,
                   changeOwnerOfFileAction,
                   deletePermissionForUserAction,
                   makeAllFilesPrivateAction,
                   makeResourcePrivateAction,
                   removeExternalAccessAction,
                   removeExternalAccessToResourceAction,
                   updatePermissionForUserAction]

        return actions

    except Exception as e:
        print e
        print "Exception occurred getting actions"


def instantiate_action(datasource_type, name, description, parameters, is_admin_only):
    actionObject = Action()
    actionObject.datasource_type = datasource_type
    actionObject.name = name
    actionObject.description = description
    actionObject.parameters = parameters
    actionObject.is_admin_only = is_admin_only

    return actionObject



def get_action(action_to_take):
    try:
        actions_list = get_actions()
        for action in actions_list:
            if action.name == action_to_take:
                return action

        return errormessage.UNKNOWN_ACTION

    except Exception as e:
        print e
        print "Exception occurred while getting action, ", action_to_take


def initiate_action(auth_token, domain_id, datasource_id, action_payload):
    try:
        action_to_take = action_payload['action_name']
        action_parameters = action_payload['parameters']
        initiated_by = action_payload['initiated_by']


        isOkay = validate_action_parameters(action_to_take, action_parameters)

        if isOkay == True:
            print "Parameter validation for action ", action_to_take, " is successful."
        else:
            return "Parameter validation for action ", action_to_take, " failed."


        print "Initiating action: ", action_to_take, " with parameters: ", action_parameters
        execution_status = execute_action(auth_token, domain_id, datasource_id, action_to_take, action_parameters)
        if execution_status == errormessage.ACTION_EXECUTION_SUCCESS:
            return audit_action(domain_id, datasource_id, initiated_by, action_to_take, action_parameters)
        else:
            return "Failed to execute action"

    except Exception as e:
        print e
        print "Exception occurred while initiating action using payload ", action_payload, " on domain: ", domain_id, " and datasource: ", datasource_id


def execute_action(auth_token, domain_id, datasource_id, action_to_take, action_parameters):
    try:

        response = ""
        action = get_action(action_to_take)

        if action == errormessage.UNKNOWN_ACTION:
            return errormessage.UNKNOWN_ACTION

        if action.name == action_constants.ActionNames.TRANSFER_OWNERSHIP:
            old_owner_email = action_parameters["old_owner_email"]
            new_owner_email = action_parameters["new_owner_email"]
            response = actions.transfer_ownership(domain_id, old_owner_email, new_owner_email)
        elif action.name == action_constants.ActionNames.CHANGE_OWNER_OF_FILE:
            old_owner_email = action_parameters["old_owner_email"]
            new_owner_email = action_parameters["new_owner_email"]
            response = actions.transfer_ownership_of_resource(domain_id, datasource_id, old_owner_email, new_owner_email)
        elif action.name == action_constants.ActionNames.MAKE_RESOURCE_PRIVATE:
            resource_id = action_parameters['resource_id']
            response = actions.make_resource_private(domain_id, datasource_id, resource_id)
        elif action.name == action_constants.ActionNames.MAKE_ALL_FILES_PRIVATE:
            user_email = action_parameters['user_email']
            response = actions.make_all_files_owned_by_user_private(domain_id, datasource_id, user_email)
        elif action.name == action_constants.ActionNames.REMOVE_EXTERNAL_ACCESS_TO_RESOURCE:
            resource_id = action_parameters['resource_id']
            response = actions.remove_external_access_to_resource(domain_id, datasource_id, resource_id)
        elif action.name == action_constants.ActionNames.REMOVE_EXTERNAL_ACCESS:
            user_email = action_parameters['user_email']
            response = actions.remove_external_access_for_all_files_owned_by_user(domain_id, datasource_id, user_email)
        elif action.name == action_constants.ActionNames.UPDATE_PERMISSION_FOR_USER:
            user_email = action_parameters['user_email']
            resource_id = action_parameters['resource_id']
            resource_owner = action_parameters['resource_owner_id']
            new_permission_role = action_parameters['new_permission_role']
            response = actions.update_permissions_of_user_to_resource(domain_id, datasource_id,
                                                                      resource_id, user_email, new_permission_role, resource_owner)
        elif action.name == action_constants.ActionNames.DELETE_PERMISSION_FOR_USER:
            user_email = action_parameters['user_email']
            resource_id = action_parameters['resource_id']
            resource_owner = action_parameters['resource_owner']
            response = actions.update_permissions_of_user_to_resource(domain_id, datasource_id,
                                                                      resource_id, user_email,
                                                                      resource_owner)

        # check response and return success/failure
        return errormessage.ACTION_EXECUTION_SUCCESS

    except Exception as e:
        print e
        print "Exception occurred while executing action ", action_to_take, " using parameters: ", action_parameters


def validate_action_parameters(action_to_take, action_parameters):
    try:

        action = get_action(action_to_take)

        if action == errormessage.UNKNOWN_ACTION:
            return False

        config_params = action.parameters
        if len(config_params) == len(action_parameters):
            for key in config_params:
                if key not in action_parameters:
                    return False
        else:
            return False

        return True

    except Exception as e:
        print e
        print "Exception occurred while validating action, ", action_to_take, " with parameters: ", action_parameters


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

        audit_log_entries.append(log_entry)

        db_session.bulk_insert_mappings(AuditLog, audit_log_entries)
        db_session.commit()

        return errormessage.ACTION_EXECUTION_SUCCESS

    except Exception as e:
        print e
        print "Exception occurred while processing audit log for domain: ", domain_id, " and datasource_id: ", " and initiated_by: ", initiated_by

def revoke_user_app_access(domain_id,datasource_id,user_email,client_id):
    try:
        driectory_service = gutils.get_directory_service(domain_id)
        driectory_service.tokens().delete(userKey=user_email,clientId=client_id).execute()
        db_session = db_connection().get_session()
        db_session.query(Application).filter(and_(Application.domain_id==domain_id,
                                                 Application.datasource_id==datasource_id,
                                                 Application.user_email == user_email,Application.client_id ==client_id)).delete()
        db_session.commit()
    except Exception as ex:
        print ex