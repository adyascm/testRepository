import traceback
from sqlalchemy import and_, or_
import json
from datetime import datetime

from adya.common.constants import constants, action_constants, urls
from adya.common.utils import messaging, response_messages
from adya.common.db.models import AuditLog, Action, Application, ApplicationUserAssociation, ResourcePermission, \
    Resource, DirectoryStructure, DomainUser, DataSource
from adya.common.db.connection import db_connection
from adya.common.utils.response_messages import ResponseMessage, Logger
from adya.gsuite import actions, gutils
from adya.common.email_templates import adya_emails
from adya.common.db.models import alchemy_encoder

BATCH_COUNT = 50


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
                                                 [{"key": "resource_id", "label": "Selected document", "editable": 0,
                                                   "hidden": 1},
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
                                                              [{"key": "resource_id", "label": "Selected document",
                                                                "editable": 0, "hidden": 1},
                                                               {"key": "resource_name", "label": "Selected document",
                                                                "editable": 0}], False)

    makeAllFilesPrivateAction = instantiate_action("GSUITE", action_constants.ActionNames.MAKE_ALL_FILES_PRIVATE,
                                                   "Remove all sharing",
                                                   "Remove access to everyone for all documents owned by selected user",
                                                   [{"key": "user_email", "label": "For user", "editable": 0}],
                                                   False)

    makeResourcePrivateAction = instantiate_action("GSUITE", action_constants.ActionNames.MAKE_RESOURCE_PRIVATE,
                                                   "Remove all sharing",
                                                   "Remove access to everyone (except owner) for selected document",
                                                   [{"key": "resource_id", "label": "Selected document", "editable": 0,
                                                     "hidden": 1},
                                                    {"key": "resource_name", "label": "Selected document",
                                                     "editable": 0}], False)

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

    notifyUserForCleanUp = instantiate_action("GSUITE", action_constants.ActionNames.NOTIFY_USER_FOR_CLEANUP,
                                              "Notify user",
                                              "Send mail to user to audit documents",
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
                                               {"key": "resource_id", "label": "Selected document", "editable": 0,
                                                "hidden": 1},
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
               addPermissionForFile,
               notifyUserForCleanUp
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
        Logger().exception(
            "Exception occurred while initiating action using payload " + str(action_payload) + " on domain: " + str(
                domain_id) + " and datasource: " + str(datasource_id))
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
    messaging.trigger_post_event(urls.GET_SCHEDULED_REPORT_PATH, auth_token, None, form_input)
    return ResponseMessage(201, "Watch report created for {}".format(user_email))


def add_resource_permission(auth_token, datasource_id, action_payload):
    action_parameters = action_payload['parameters']
    new_permission_role = action_parameters['new_permission_role']
    resource_id = action_parameters['resource_id']
    resource_owner = action_parameters['resource_owner_id']

    permission = ResourcePermission()
    permission.datasource_id = datasource_id
    permission.resource_id = resource_id
    permission.email = action_parameters['user_email']
    permission.permission_type = new_permission_role

    query_params = {"user_email": resource_owner, "datasource_id": datasource_id,
                    "initiated_by_email": action_payload['initiated_by']}
    body = json.dumps([permission], cls=alchemy_encoder())
    response = messaging.trigger_post_event(urls.ACTION_PATH, auth_token, query_params,
                                            {"permissions": json.loads(body)}, "gsuite", constants.TriggerType.SYNC)
    return response


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
        Logger().info("add a new permission ")
        response = add_resource_permission(auth_token, datasource_id, action_payload)
        return response

    if not existing_permission:
        Logger().info("Permission does not exist in db, so cannot update - Bad Request")
        return ResponseMessage(400, "Bad Request - Permission not found in records")

    query_param = {'user_email': resource_owner, 'initiated_by_email': initiated_user, 'datasource_id': datasource_id}
    existing_permission_json = json.loads(json.dumps(existing_permission, cls=alchemy_encoder()))
    existing_permission_json["permission_type"] = new_permission_role
    body = [existing_permission_json]
    response = "Action executed"
    if action_payload['key'] == action_constants.ActionNames.DELETE_PERMISSION_FOR_USER:
        response = messaging.trigger_delete_event(urls.ACTION_PATH, auth_token, query_param, {"permissions": body},
                                                  "gsuite", constants.TriggerType.SYNC)
    else:
        response = messaging.trigger_update_event(urls.ACTION_PATH, auth_token, query_param, {"permissions": body},
                                                  "gsuite", constants.TriggerType.SYNC)

    return response


def update_access_for_owned_files(auth_token, domain_id, datasource_id, user_email, initiated_by, removal_type):
    db_session = db_connection().get_session()
    # By default we remove all external access i.e. PUBLIC and EXTERNAL
    permission_type = [constants.ResourceExposureType.EXTERNAL, constants.ResourceExposureType.PUBLIC]
    # Other option is to also remove all access i.e. DOMAIN and INTERNAL also
    if not removal_type == constants.ResourceExposureType.EXTERNAL:
        permission_type.append(constants.ResourceExposureType.DOMAIN)
        permission_type.append(constants.ResourceExposureType.INTERNAL)

    shared_resources = db_session.query(Resource).filter(and_(Resource.datasource_id == datasource_id,
                                                              Resource.resource_owner_id == user_email,
                                                              Resource.exposure_type.in_(permission_type))).all()

    permissions_to_update = []
    response_data = {}
    for resource in shared_resources:
        has_domain_sharing = False
        permission_changes = []
        for permission in resource.permissions:
            if permission.exposure_type in permission_type and permission.email != user_email:
                permissions_to_update.append(permission)

            if permission.exposure_type == constants.ResourceExposureType.DOMAIN:
                has_domain_sharing = True

    response = execute_batch_delete(auth_token, datasource_id, user_email, initiated_by, permissions_to_update)
    return response


def update_access_for_resource(auth_token, domain_id, datasource_id, action_payload, removal_type):
    action_parameters = action_payload['parameters']
    resource_id = action_parameters['resource_id']
    db_session = db_connection().get_session()
    resource = db_session.query(Resource).filter(
        and_(Resource.datasource_id == datasource_id, Resource.resource_id == resource_id)).first()
    if not resource:
        return response_messages.ResponseMessage(400, "Bad Request - No such file found")

    permissions_to_update = []
    has_domain_sharing = False
    for permission in resource.permissions:
        if removal_type == constants.ResourceExposureType.EXTERNAL:
            if permission.exposure_type == constants.ResourceExposureType.EXTERNAL or permission.exposure_type == constants.ResourceExposureType.PUBLIC:
                permissions_to_update.append(permission)
            elif permission.exposure_type == constants.ResourceExposureType.DOMAIN:
                has_domain_sharing = True

        else:
            if permission.permission_type != 'owner':
                permissions_to_update.append(permission)

    response = execute_batch_delete(auth_token, datasource_id, resource.resource_owner_id,
                                    action_payload['initiated_by'], permissions_to_update)
    return response


def remove_all_permissions_for_user(auth_token, domain_id, datasource_id, user_email, initiated_by):
    db_session = db_connection().get_session()
    resource_permissions = db_session.query(ResourcePermission).filter(and_(ResourcePermission.datasource_id ==
                                                                            datasource_id,
                                                                            ResourcePermission.email == user_email,
                                                                            ResourcePermission.permission_type != "owner")).all()
    permissions_to_update_by_resource_owner = {}
    for permission in resource_permissions:
        owner = permission.resource.resource_owner_id
        if owner in permissions_to_update_by_resource_owner:
            permissions_to_update_by_resource_owner[owner].append(permission)
        else:
            permissions_to_update_by_resource_owner[owner] = [permission]

    response = response_messages.ResponseMessage(200, 'Action submitted successfully')
    for owner in permissions_to_update_by_resource_owner:
        permissions_to_update = permissions_to_update_by_resource_owner[owner]
        response = execute_batch_delete(auth_token, datasource_id, owner, initiated_by, permissions_to_update)
    return response


def execute_batch_delete(auth_token, datasource_id, user_email, initiated_by, permissions_to_update):
    permissions_to_update_count = len(permissions_to_update)
    sent_perms_count = 0
    query_param = {'datasource_id': datasource_id, "user_email": user_email, "initiated_by_email": initiated_by}
    sync_response = 'Action completed successfully'
    while sent_perms_count < permissions_to_update_count:
        permissions_to_send = permissions_to_update[sent_perms_count:sent_perms_count + BATCH_COUNT]
        body = json.dumps(permissions_to_send, cls=alchemy_encoder())
        if permissions_to_update_count < BATCH_COUNT:
            sync_response = messaging.trigger_delete_event(urls.ACTION_PATH, auth_token, query_param,
                                                           {"permissions": json.loads(body)}, "gsuite",
                                                           constants.TriggerType.SYNC)
        else:
            messaging.trigger_delete_event(urls.ACTION_PATH, auth_token, query_param, {"permissions": json.loads(body)},
                                           "gsuite")
        sent_perms_count += BATCH_COUNT

    if permissions_to_update_count < BATCH_COUNT:
        return sync_response
    else:
        return response_messages.ResponseMessage(200, 'Action submitted successfully')


def modify_group_membership(auth_token, datasource_id, action_name, action_parameters):
    user_email = action_parameters["user_email"]
    group_email = action_parameters["group_email"]
    db_session = db_connection().get_session()
    if action_name == action_constants.ActionNames.REMOVE_USER_FROM_GROUP:
        response = actions.delete_user_from_group(auth_token, group_email, user_email)
        if constants.ResponseType.ERROR in response:
            return response_messages.ResponseMessage(response.resp.status,
                                                     'Action failed with error - ' + response['error']['message'])
        db_session.query(DirectoryStructure).filter(and_(DirectoryStructure.datasource_id == datasource_id,
                                                         DirectoryStructure.parent_email == group_email,
                                                         DirectoryStructure.member_email == user_email)).delete()
    elif action_name == action_constants.ActionNames.ADD_USER_TO_GROUP:
        response = actions.add_user_to_group(auth_token, group_email, user_email)
        if constants.ResponseType.ERROR in response:
            return response_messages.ResponseMessage(response.resp.status,
                                                     'Action failed with error - ' + response['error']['message'])
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

    # Watch report action
    if action_config.key == action_constants.ActionNames.WATCH_ALL_ACTION_FOR_USER:
        return create_watch_report(auth_token, datasource_id, action_payload)

    # Trigger mail for cleaning files
    elif action_config.key == action_constants.ActionNames.NOTIFY_USER_FOR_CLEANUP:
        user_email = action_parameters['user_email']
        if adya_emails.send_clean_files_email(datasource_id, user_email):
            return ResponseMessage(200, "Notification sent to {} for cleanUp".format(user_email))
        else:
            return ResponseMessage(400, "Sending Notification failed for {}".format(user_email))

    # Directory change actions
    elif action_config.key == action_constants.ActionNames.REMOVE_USER_FROM_GROUP or action_config.key == action_constants.ActionNames.ADD_USER_TO_GROUP:
        return modify_group_membership(auth_token, datasource_id, action_config.key, action_parameters)

    # Transfer ownership action
    elif action_config.key == action_constants.ActionNames.TRANSFER_OWNERSHIP:
        old_owner_email = action_parameters["old_owner_email"]
        new_owner_email = action_parameters["new_owner_email"]
        response = actions.transfer_ownership(auth_token, old_owner_email, new_owner_email)
        return response_messages.ResponseMessage(202, "Action submitted successfully")

    # Bulk permission change actions for user
    elif action_config.key == action_constants.ActionNames.MAKE_ALL_FILES_PRIVATE:
        user_email = action_parameters['user_email']
        initiated_by = action_payload['initiated_by']
        return update_access_for_owned_files(auth_token, domain_id, datasource_id, user_email, initiated_by, "ALL")
    elif action_config.key == action_constants.ActionNames.REMOVE_EXTERNAL_ACCESS:
        user_email = action_parameters['user_email']
        initiated_by = action_payload['initiated_by']
        return update_access_for_owned_files(auth_token, domain_id, datasource_id, user_email, initiated_by,
                                             constants.ResourceExposureType.EXTERNAL)
    elif action_config.key == action_constants.ActionNames.REMOVE_ALL_ACCESS_FOR_USER:
        user_email = action_parameters['user_email']
        initiated_by = action_payload['initiated_by']
        return remove_all_permissions_for_user(auth_token, domain_id, datasource_id, user_email, initiated_by)

    # Bulk permission change actions for resource
    elif action_config.key == action_constants.ActionNames.MAKE_RESOURCE_PRIVATE:
        return update_access_for_resource(auth_token, domain_id, datasource_id, action_payload, 'ALL')
    elif action_config.key == action_constants.ActionNames.REMOVE_EXTERNAL_ACCESS_TO_RESOURCE:
        return update_access_for_resource(auth_token, domain_id, datasource_id, action_payload,
                                          constants.ResourceExposureType.EXTERNAL)


    # Single Resource permission change actions
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
        Logger().exception("Exception occurred while processing audit log for domain: " + str(
            domain_id) + " and datasource_id: " + str(datasource_id) + " and initiated_by: " + str(initiated_by))


def revoke_user_app_access(auth_token, datasource_id, user_email, client_id):
    try:
        driectory_service = gutils.get_directory_service(auth_token)
        driectory_service.tokens().delete(userKey=user_email, clientId=client_id).execute()
        db_session = db_connection().get_session()
        db_session.query(ApplicationUserAssociation).filter(
            and_(ApplicationUserAssociation.datasource_id == datasource_id,
                 ApplicationUserAssociation.user_email == user_email,
                 ApplicationUserAssociation.client_id == client_id)).delete()

        # check if app is associated with any user
        app_user_association = db_session.query(ApplicationUserAssociation).filter(
            and_(ApplicationUserAssociation.datasource_id == datasource_id,
                 ApplicationUserAssociation.client_id == client_id)).count()

        # if no user is associated with app, than remove the app also
        if app_user_association < 1:
            db_session.query(Application).filter(
                and_(Application.datasource_id == datasource_id, Application.client_id == client_id)).delete()

        db_connection().commit()
        return True
    except Exception as ex:
        Logger().exception("Exception occurred while deleting app for datasource_id: " + str(
            datasource_id) + " and user_email: " + str(user_email))
        return False