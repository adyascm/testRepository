from sqlalchemy import and_, or_
import json
from datetime import datetime

import math
import pystache

from adya.common.constants import constants, action_constants, urls
from adya.common.constants.action_constants import connector_servicename_map, datasource_execute_action_map
from adya.common.db import db_utils, action_definitions
from adya.common.db.db_utils import get_datasource
from adya.common.utils import messaging, response_messages
from adya.common.db.models import AuditLog, Action, Application, ApplicationUserAssociation, ResourcePermission, \
    Resource, DirectoryStructure, LoginUser
from adya.common.db.connection import db_connection
from adya.common.utils.response_messages import ResponseMessage, Logger
from adya.gsuite import actions, gutils
from adya.common.email_templates import adya_emails
from adya.common.db.models import alchemy_encoder

BATCH_COUNT = 100


def get_actions():
    return action_definitions.actions


def instantiate_action(datasource_type, key, name, description, parameters, is_admin_only):
    actionObject = Action()
    actionObject.datasource_type = datasource_type
    actionObject.key = key
    actionObject.name = name
    actionObject.description = description
    actionObject.parameters = parameters
    actionObject.is_admin_only = is_admin_only

    return actionObject


def get_action(action_key):
    actions_list = get_actions()
    for action in actions_list:
        if action["key"] == action_key:
            return action
    return None


def initiate_action(auth_token, action_payload):
    try:
        action_key = action_payload['key']
        initiated_by = action_payload['initiated_by']
        action_parameters = action_payload['parameters']
        datasource_id = action_payload['datasource_id'] if 'datasource_id' in action_payload else 'MANUAL'

        db_session = db_connection().get_session()
        login_user_info = db_session.query(LoginUser).filter(
            LoginUser.auth_token == auth_token).first()
        domain_id = login_user_info.domain_id

        action_config = get_action(action_key)

        if not action_config or not validate_action_parameters(action_config, action_parameters):
            return ResponseMessage(400, "Failed to execute action - Validation failed")

        log_id = action_payload['log_id'] if 'log_id' in action_payload else None
        if log_id:
            log_entry = db_session.query(AuditLog).filter(
                and_(AuditLog.log_id == log_id)).first()
        else:
            log_entry = audit_action(domain_id, datasource_id,
                                     initiated_by, action_config, action_parameters)

        execution_status = execute_action(
            auth_token, domain_id, datasource_id, action_config, action_payload, log_entry)
        db_connection().commit()
        Logger().info("initiate_action : response body  - {}".format(execution_status.get_response_body()))
        response_body = json.loads(json.dumps(execution_status.get_response_body()))
        response_body['id'] = log_entry.log_id

        if execution_status.response_code == constants.ACCEPTED_STATUS_CODE:
            action_payload['log_id'] = log_entry.log_id
            messaging.trigger_post_event(
                urls.INITIATE_ACTION_PATH, auth_token, None, action_payload)

        return ResponseMessage(execution_status.response_code, None, response_body)

    except Exception as e:
        Logger().exception(
            "Exception occurred while initiating action using payload " + str(action_payload))
        return ResponseMessage(500, "Failed to execute action - {}".format(e))


def create_watch_report(auth_token, datasource_id, action_payload, log_entry):
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
    messaging.trigger_post_event(
        urls.GET_SCHEDULED_REPORT_PATH, auth_token, None, form_input)
    log_entry.status = action_constants.ActionStatus.SUCCESS.value
    log_entry.message = 'Action completed successfully'
    return ResponseMessage(201, "Watch report created for {}".format(user_email))


def add_resource_permission(auth_token, datasource_id, action_payload, log_entry):
    action_parameters = action_payload['parameters']
    new_permission_role = action_parameters['new_permission_role']
    resource_id = action_parameters['resource_id']
    resource_owner = action_parameters['resource_owner_id']

    permission = ResourcePermission()
    permission.datasource_id = datasource_id
    permission.resource_id = resource_id
    permission.email = action_parameters['user_email']
    permission.permission_type = new_permission_role

    datasource_obj = get_datasource(datasource_id)
    datasource_type = datasource_obj.datasource_type

    body = json.dumps([permission], cls=alchemy_encoder())
    payload = {"permissions": body, "datasource_id": datasource_id, "domain_id": datasource_obj.domain_id,
               "initiated_by_email": action_payload['initiated_by'],
               "log_id": str(log_entry.log_id), "user_email": resource_owner, "action_type": action_payload['key']}
    response = messaging.trigger_post_event(datasource_execute_action_map[datasource_type], auth_token, None,
                                            payload, connector_servicename_map[datasource_type],
                                            constants.TriggerType.SYNC.value)

    if response and response.response_code == constants.SUCCESS_STATUS_CODE:
        return response_messages.ResponseMessage(constants.SUCCESS_STATUS_CODE, 'Action completed successfully')
    else:
        return response_messages.ResponseMessage(response.response_code, response.response_body['message'])


def update_or_delete_resource_permission(auth_token, datasource_id, action_payload, log_entry):
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

    if not existing_permission and action_payload['key'] == action_constants.ActionNames.CHANGE_OWNER_OF_FILE.value:
        Logger().info("add a new permission ")
        response = add_resource_permission(
            auth_token, datasource_id, action_payload, log_entry)
        return response

    if not existing_permission:
        status_message = "Bad Request - Permission not found in records"
        Logger().info(status_message)
        log_entry.status = action_constants.ActionStatus.FAILED.value
        log_entry.message = status_message
        return ResponseMessage(400, status_message)

    query_param = {'user_email': resource_owner, 'initiated_by_email': initiated_user, 'datasource_id': datasource_id,
                   "log_id": str(log_entry.log_id)}
    existing_permission_json = json.loads(
        json.dumps(existing_permission, cls=alchemy_encoder()))
    existing_permission_json["permission_type"] = new_permission_role

    body = json.dumps([existing_permission_json], cls=alchemy_encoder())
    response = "Action executed"

    datasource_obj = get_datasource(datasource_id)
    datasource_type = datasource_obj.datasource_type

    payload = {"permissions": body, "datasource_id": datasource_id, "domain_id": datasource_obj.domain_id,
               "initiated_by_email": action_payload['initiated_by'],
               "log_id": str(log_entry.log_id), "user_email": resource_owner, "action_type": action_payload['key'], "resource_name": action_parameters["resource_name"]}
    response = messaging.trigger_post_event(datasource_execute_action_map[datasource_type], auth_token, None,
                                            payload, connector_servicename_map[datasource_type],
                                            constants.TriggerType.SYNC.value)

    if response and response.response_code == constants.SUCCESS_STATUS_CODE:
        return response_messages.ResponseMessage(constants.SUCCESS_STATUS_CODE, 'Action completed successfully')
    else:
        return response_messages.ResponseMessage(response.response_code, response.response_body['message'])


def update_access_for_owned_files(auth_token, domain_id, datasource_id, user_email, initiated_by, removal_type,
                                  log_entry, action_key):
    db_session = db_connection().get_session()
    # By default we remove all external access i.e. PUBLIC and EXTERNAL
    permission_type = [constants.EntityExposureType.EXTERNAL.value, constants.EntityExposureType.PUBLIC.value,
                       constants.EntityExposureType.ANYONEWITHLINK.value]
    # Other option is to also remove all access i.e. DOMAIN and INTERNAL also
    if not removal_type == constants.EntityExposureType.EXTERNAL.value:
        permission_type.append(constants.EntityExposureType.DOMAIN.value)
        permission_type.append(constants.EntityExposureType.INTERNAL.value)

    shared_resource_query = db_session.query(ResourcePermission).filter(and_(Resource.datasource_id == datasource_id,
                                                                             Resource.resource_owner_id == user_email)).filter(and_(
                                                                                 ResourcePermission.datasource_id == Resource.datasource_id,
                                                                                 ResourcePermission.resource_id == Resource.resource_id,
                                                                                 ResourcePermission.email != user_email,
                                                                                 ResourcePermission.exposure_type.in_(permission_type)))

    if not log_entry.total_count:
        log_entry.total_count = shared_resource_query.count()
        db_connection().commit()

    permissions_to_update = shared_resource_query.limit(BATCH_COUNT).all()
    more_to_execute = False
    if len(permissions_to_update) == BATCH_COUNT:
        more_to_execute = True

    if len(permissions_to_update) < 1:
        log_entry.message = 'Action completed successfully'
        log_entry.status = 'SUCCESS'
        return response_messages.ResponseMessage(200, 'Action complete : Nothing to update')

    response = execute_batch_delete(auth_token, datasource_id, user_email, initiated_by, permissions_to_update,
                                    log_entry, action_key, more_to_execute)

    return response


def update_access_for_resource(auth_token, domain_id, datasource_id, action_payload, removal_type, log_entry,
                               action_key):
    action_parameters = action_payload['parameters']
    resource_id = action_parameters['resource_id']
    db_session = db_connection().get_session()
    resource = db_session.query(Resource).filter(
        and_(Resource.datasource_id == datasource_id, Resource.resource_id == resource_id)).first()
    if not resource:
        status_message = "Bad Request - No such file found"
        log_entry.status = action_constants.ActionStatus.FAILED.value
        log_entry.message = status_message
        return response_messages.ResponseMessage(400, status_message)

    permissions_to_update = []
    has_domain_sharing = False
    for permission in resource.permissions:
        if removal_type == constants.EntityExposureType.EXTERNAL.value:
            if permission.exposure_type == constants.EntityExposureType.EXTERNAL.value or permission.exposure_type == \
                    constants.EntityExposureType.PUBLIC.value or permission.exposure_type == constants.EntityExposureType.ANYONEWITHLINK.value:
                permissions_to_update.append(permission)
            elif permission.exposure_type == constants.EntityExposureType.DOMAIN.value:
                has_domain_sharing = True

        else:
            if permission.permission_type != 'owner':
                permissions_to_update.append(permission)

    response = execute_batch_delete(auth_token, datasource_id, resource.resource_owner_id,
                                    action_payload['initiated_by'], permissions_to_update, log_entry, action_key)
    if len(permissions_to_update) < 1:
        log_entry.message = 'Action completed successfully'
        log_entry.status = 'SUCCESS'
        return response_messages.ResponseMessage(200, 'Action impermissible : No files found')

    return response


def remove_all_permissions_for_user(auth_token, domain_id, datasource_id, user_email, initiated_by, log_entry,
                                    action_key):
    db_session = db_connection().get_session()
    login_user = db_utils.get_user_session(auth_token)
    login_user_email = login_user.email
    is_admin = login_user.is_admin
    is_service_account_is_enabled = login_user.is_serviceaccount_enabled
    resource_permissions = db_session.query(ResourcePermission).filter(and_(ResourcePermission.datasource_id == datasource_id,
                                                                            ResourcePermission.email == user_email,
                                                                            ResourcePermission.permission_type != "owner",
                                                                            Resource.datasource_id == ResourcePermission.datasource_id,
                                                                            Resource.resource_id == ResourcePermission.resource_id))

    if is_service_account_is_enabled and not is_admin:
        resource_permissions = resource_permissions.filter(and_(Resource.resource_owner_id == login_user_email))

    if not log_entry.total_count:
        log_entry.total_count = resource_permissions.count()
        db_connection().commit()

    Logger().info("remove_all_permissions_for_user : retrieve permission for a user from db")
    resource_permissions = resource_permissions.order_by(Resource.resource_owner_id.asc()).limit(BATCH_COUNT).all()
    more_to_execute = False
    if len(resource_permissions) == BATCH_COUNT:
        more_to_execute = True

    Logger().info("remove_all_permissions_for_user : form a permission payload for each owner")
    permissions_to_update_by_resource_owner = {}
    for permission in resource_permissions:
        owner = permission.resource.resource_owner_id
        if owner in permissions_to_update_by_resource_owner:
            permissions_to_update_by_resource_owner[owner].append(permission)
        else:
            permissions_to_update_by_resource_owner[owner] = [permission]

    if len(permissions_to_update_by_resource_owner) < 1:
        log_entry.message = 'Action completed successfully'
        log_entry.status = 'SUCCESS'
        return response_messages.ResponseMessage(200, 'Action completed : Nothing to update')

    response = response_messages.ResponseMessage(
        200, 'Action submitted successfully')
    for owner in permissions_to_update_by_resource_owner:
        permissions_to_update = permissions_to_update_by_resource_owner[owner]
        Logger().info("remove_all_permissions_for_user : call execute_batch_delete function")
        response = execute_batch_delete(
            auth_token, datasource_id, owner, initiated_by, permissions_to_update, log_entry, action_key, more_to_execute)

    return response


def execute_batch_delete(auth_token, datasource_id, user_email, initiated_by, permissions_to_update, log_entry,
                         action_type, more_to_execute=False):
    sync_response = None
    datasource_obj = get_datasource(datasource_id)
    datasource_type = datasource_obj.datasource_type

    body = json.dumps(permissions_to_update, cls=alchemy_encoder())

    payload = {"permissions": body, "datasource_id": datasource_id,
               "domain_id": datasource_obj.domain_id, "more_to_execute": 1 if more_to_execute else 0,
               "initiated_by_email": initiated_by,
               "log_id": str(log_entry.log_id), "user_email": user_email, "action_type": action_type}

    sync_response = messaging.trigger_post_event(datasource_execute_action_map[datasource_type], auth_token, None,
                                                     payload, connector_servicename_map[datasource_type], constants.TriggerType.SYNC.value)

    if sync_response.response_code != constants.SUCCESS_STATUS_CODE:
        return sync_response
    elif more_to_execute:
        return response_messages.ResponseMessage(constants.ACCEPTED_STATUS_CODE, 'Action submitted successfully')
    else:
        return response_messages.ResponseMessage(200, 'Action completed successfully')

def modify_group_membership(auth_token, datasource_id, action_name, action_parameters, log_entry):
    user_email = action_parameters["user_email"]
    group_email = action_parameters["group_email"]
    db_session = db_connection().get_session()
    status_message = "Action completed successfully"
    datasource_obj = get_datasource(datasource_id)
    datasource_type = datasource_obj.datasource_type

    payload = {"log_id": str(log_entry.log_id), "action_type": action_name, "user_email": user_email,
               "group_email": group_email, 'datasource_id': datasource_id, "domain_id": datasource_obj.domain_id}
    response = messaging.trigger_post_event(datasource_execute_action_map[datasource_type], auth_token, None,
                                            payload, connector_servicename_map[datasource_type], constants.TriggerType.SYNC.value)

    if response and action_name == action_constants.ActionNames.REMOVE_USER_FROM_GROUP.value:
        if response.response_code != constants.SUCCESS_STATUS_CODE:
            log_entry.status = action_constants.ActionStatus.FAILED.value
            status_message = 'Action failed with error - ' + \
                response.response_body['error']['message']
            log_entry.message = status_message
            return response_messages.ResponseMessage(response.response_code, status_message)
        db_session.query(DirectoryStructure).filter(and_(DirectoryStructure.datasource_id == datasource_id,
                                                         DirectoryStructure.parent_email == group_email,
                                                         DirectoryStructure.member_email == user_email)).delete()
    elif response and action_name == action_constants.ActionNames.ADD_USER_TO_GROUP.value:
        if response.response_code != constants.SUCCESS_STATUS_CODE:
            log_entry.status = action_constants.ActionStatus.FAILED.value
            message = response.response_body['error']['message'] if 'message' in \
                response.response_body['error'] else response.response_body['error']
            status_message = 'Action failed with error - ' + message
            log_entry.message = status_message
            return response_messages.ResponseMessage(response.response_code, status_message)

        response_body = response.response_body
        dirstructure = DirectoryStructure()
        dirstructure.datasource_id = datasource_id
        dirstructure.member_email = user_email
        dirstructure.parent_email = group_email
        dirstructure.member_type = response_body['type']
        dirstructure.member_role = response_body['role']
        dirstructure.member_id = response_body['id']
        db_session.add(dirstructure)

    log_entry.status = action_constants.ActionStatus.SUCCESS.value
    log_entry.message = status_message
    db_connection().commit()
    return response_messages.ResponseMessage(200, status_message)


def transfer_ownership(auth_token, datasource_id, action_name, action_parameters, log_entry):
    status_message = "Action submitted successfully"
    datasource_obj = get_datasource(datasource_id)
    datasource_type = datasource_obj.datasource_type

    payload = {"log_id": str(log_entry.log_id), "action_type": action_name, "user_email": action_parameters["old_owner_email"],
               "new_owner_email": action_parameters["new_owner_email"], 'datasource_id': datasource_id,
               "domain_id": datasource_obj.domain_id}
    messaging.trigger_post_event(datasource_execute_action_map[datasource_type], auth_token, None,
                                 payload, connector_servicename_map[datasource_type])

    log_entry.status = action_constants.ActionStatus.SUCCESS.value
    log_entry.message = status_message
    db_connection().commit()
    return response_messages.ResponseMessage(200, status_message)


def delete_repository(auth_token, datasource_id, action_key, action_parameters, log_entry):
    datasource_obj = get_datasource(datasource_id)
    datasource_type = datasource_obj.datasource_type
    status_message = "Action submitted successfully"

    payload = {
        "resource_name": action_parameters["resource_name"],
        "action_type": action_key,
        "datasource_id": datasource_id
    }
    messaging.trigger_post_event(datasource_execute_action_map[datasource_type], auth_token, None,
                                 payload, connector_servicename_map[datasource_type])

    log_entry.status = action_constants.ActionStatus.SUCCESS.value
    log_entry.message = status_message
    db_connection().commit()
    return response_messages.ResponseMessage(200, status_message)

def execute_action(auth_token, domain_id, datasource_id, action_config, action_payload, log_entry):
    action_parameters = action_payload['parameters']
    response_msg = ''
    action_key = action_config["key"]
    # Watch report action
    if action_key == action_constants.ActionNames.WATCH_ALL_ACTION_FOR_USER.value:
        response_msg = create_watch_report(
            auth_token, datasource_id, action_payload, log_entry)

    # Trigger mail for cleaning files
    elif action_key == action_constants.ActionNames.NOTIFY_USER_FOR_CLEANUP.value:
        user_email = action_parameters['user_email']
        full_name = action_parameters['full_name']
        initiated_by = action_payload['initiated_by']
        status_message = "Notification sent to {} for cleanUp".format(
            user_email)
        log_entry.status = action_constants.ActionStatus.SUCCESS.value
        status_code = 200
        if not adya_emails.send_clean_files_email(datasource_id, user_email, full_name, initiated_by):
            status_message = "Sending Notification failed for {}".format(
                user_email)
            log_entry.status = action_constants.ActionStatus.FAILED.value
            status_code = 400
        log_entry.message = status_message
        response_msg = ResponseMessage(status_code, status_message)

    # Directory change actions
    elif action_key == action_constants.ActionNames.REMOVE_USER_FROM_GROUP.value or action_key == action_constants.ActionNames.ADD_USER_TO_GROUP.value:
        response_msg = modify_group_membership(
            auth_token, datasource_id, action_key, action_parameters, log_entry)

    # Transfer ownership
    # part of batch action
    elif action_key == action_constants.ActionNames.TRANSFER_OWNERSHIP.value:
        response_msg = transfer_ownership(
            auth_token, datasource_id, action_key, action_parameters, log_entry)

    # Bulk permission change actions for user
    elif action_key == action_constants.ActionNames.MAKE_ALL_FILES_PRIVATE.value:
        user_email = action_parameters['user_email']
        initiated_by = action_payload['initiated_by']
        response_msg = update_access_for_owned_files(auth_token, domain_id, datasource_id, user_email, initiated_by,
                                                     "ALL", log_entry, action_key)

    elif action_key == action_constants.ActionNames.REMOVE_EXTERNAL_ACCESS.value:
        user_email = action_parameters['user_email']
        initiated_by = action_payload['initiated_by']
        response_msg = update_access_for_owned_files(auth_token, domain_id, datasource_id, user_email, initiated_by,
                                                     constants.EntityExposureType.EXTERNAL.value, log_entry,
                                                     action_key)

    elif action_key == action_constants.ActionNames.REMOVE_ALL_ACCESS_FOR_USER.value:
        user_email = action_parameters['user_email']
        initiated_by = action_payload['initiated_by']
        response_msg = remove_all_permissions_for_user(auth_token, domain_id, datasource_id, user_email, initiated_by,
                                                       log_entry, action_key)
    # Bulk permission change actions for resource
    elif action_key == action_constants.ActionNames.MAKE_RESOURCE_PRIVATE.value:
        response_msg = update_access_for_resource(auth_token, domain_id, datasource_id, action_payload, 'ALL',
                                                  log_entry, action_key)
    elif action_key == action_constants.ActionNames.REMOVE_EXTERNAL_ACCESS_TO_RESOURCE.value:
        response_msg = update_access_for_resource(auth_token, domain_id, datasource_id, action_payload,
                                                  constants.EntityExposureType.EXTERNAL.value, log_entry, action_key)

    # Single Resource permission change actions
    elif action_key == action_constants.ActionNames.UPDATE_PERMISSION_FOR_USER.value:
        response_msg = update_or_delete_resource_permission(
            auth_token, datasource_id, action_payload, log_entry)
    elif action_key == action_constants.ActionNames.DELETE_PERMISSION_FOR_USER.value:
        action_parameters['new_permission_role'] = ''
        response_msg = update_or_delete_resource_permission(
            auth_token, datasource_id, action_payload, log_entry)
    elif action_key == action_constants.ActionNames.ADD_PERMISSION_FOR_A_FILE.value:
        response_msg = add_resource_permission(
            auth_token, datasource_id, action_payload, log_entry)
    elif action_key == action_constants.ActionNames.CHANGE_OWNER_OF_FILE.value:
        action_parameters['new_permission_role'] = constants.Role.OWNER.value
        action_parameters['resource_owner_id'] = action_parameters["old_owner_email"]
        action_parameters['user_email'] = action_parameters["new_owner_email"]
        response_msg = update_or_delete_resource_permission(
            auth_token, datasource_id, action_payload, log_entry)
    # Uninstalling an app for a user
    elif action_key == action_constants.ActionNames.REMOVE_USER_FROM_APP.value:
        user_email = action_parameters['user_email']
        app_id = action_parameters['app_id']
        response_msg = revoke_user_app_access(
            auth_token, datasource_id, user_email, app_id, log_entry)
    # Uninstalling app for the entire domain
    elif action_key == action_constants.ActionNames.REMOVE_APP_FOR_DOMAIN.value:
        app_id = action_parameters["app_id"]
        response_msg = remove_app_for_domain(auth_token, app_id, log_entry)
    #Deleting a repository
    elif action_key == action_constants.ActionNames.DELETE_REPOSITORY.value:
        response_msg = delete_repository(
            auth_token, datasource_id, action_key, action_parameters, log_entry)
    # multi-select users view actions        
    elif action_key == action_constants.ActionNames.NOTIFY_MULTIPLE_USERS_FOR_CLEANUP.value:
        users_email = action_parameters['users_email']
        users_name = action_parameters['users_name']
        status_message = 'Action submitted successfully'
        log_entry.status = action_constants.ActionStatus.SUBMITTED.value
        if len(users_email)>0:
            for i in range(len(users_email)):
                modified_action_payload = dict(action_payload)
                modified_action_payload['parameters'] = {'user_email':users_email[i], 'full_name': users_name[i]}
                modified_action_payload['key'] = action_constants.ActionNames.NOTIFY_USER_FOR_CLEANUP.value
                messaging.trigger_post_event(urls.INITIATE_ACTION_PATH, auth_token, None, modified_action_payload)
        response_msg = ResponseMessage(200, status_message)        
    elif action_key == action_constants.ActionNames.REMOVE_ALL_ACCESS_FOR_MULTIPLE_USERS.value:
        users_email = action_parameters['users_email']
        users_name = action_parameters['users_name']
        initiated_by = action_payload['initiated_by']
        status_message = 'Action submitted successfully'
        log_entry.status = action_constants.ActionStatus.SUBMITTED.value
        response_msg = ResponseMessage(200, status_message)        
        if len(users_email)>0:
            for i in range(len(users_email)):
                modified_action_payload = dict(action_payload)
                modified_action_payload['parameters'] = {'user_email':users_email[i], 'full_name':users_name[i]}
                modified_action_payload['key'] = action_constants.ActionNames.REMOVE_ALL_ACCESS_FOR_USER.value
                messaging.trigger_post_event(urls.INITIATE_ACTION_PATH, auth_token, None, modified_action_payload)
    elif action_key == action_constants.ActionNames.OFFBOARD_INTERNAL_USER.value:
        users_info = action_parameters['users_info']
        datasource_obj = get_datasource(datasource_id)
        datasource_type = datasource_obj.datasource_type
        status_message = 'Action submitted successfully'
        log_entry.status = action_constants.ActionStatus.SUBMITTED.value
        response_msg = ResponseMessage(200, status_message)
        for key, value in users_info.iteritems():
            user_email = key
            action_payload['parameters']['user_email'] = user_email
            action_payload['parameters']['full_name'] = value
            if datasource_type == constants.ConnectorTypes.GSUITE.value:
                # remove all access for a user from gsuite
                remove_all_access_action_payload = dict(action_payload)
                remove_all_access_action_payload['key'] = action_constants.ActionNames.REMOVE_ALL_ACCESS_FOR_USER.value
                messaging.trigger_post_event(urls.INITIATE_ACTION_PATH, auth_token, None,
                                             remove_all_access_action_payload)

                # transfer the ownership
                transfer_ownership_action_payload = dict(action_payload)
                transfer_ownership_action_payload['key'] = action_constants.ActionNames.TRANSFER_OWNERSHIP.value
                transfer_ownership_action_payload['parameters']['old_owner_email'] = user_email
                messaging.trigger_post_event(urls.INITIATE_ACTION_PATH, auth_token, None,
                                             transfer_ownership_action_payload)

            # remove user from all groups or channel
            db_session = db_connection().get_session()
            all_groups = db_session.query(DirectoryStructure).filter(
                and_(DirectoryStructure.datasource_id == datasource_id,
                     DirectoryStructure.member_email == user_email)).all()
            groups_email_list = [group.parent_email for group in all_groups]
            remove_from_group_action_payload = dict(action_payload)
            remove_from_group_action_payload['key'] = action_constants.ActionNames.REMOVE_USER_FROM_GROUP.value
            for group_email in groups_email_list:
                remove_from_group_action_payload['parameters']['group_email'] = group_email
                messaging.trigger_post_event(urls.INITIATE_ACTION_PATH, auth_token, None,
                                             remove_from_group_action_payload)


    # multi-select docs view actions
    elif action_key == action_constants.ActionNames.CHANGE_OWNER_OF_MULIPLE_FILES.value:
        old_owner_emails = action_parameters["old_owner_emails"]
        new_owner_email = action_parameters["new_owner_email"]
        resources_ids = action_parameters['resources_ids']
        resources_names = action_parameters['resources_names']
        status_message = 'Action submitted successfully'
        log_entry.status = action_constants.ActionStatus.SUCCESS.value
        response_msg = ResponseMessage(200, status_message)        
        if len(old_owner_emails)>0:
            for i,old_owner_email in enumerate(old_owner_emails):
                modified_action_payload = dict(action_payload)
                modified_action_payload['parameters'] = {'new_owner_email':new_owner_email, 'old_owner_email': old_owner_email, 'resource_id':resources_ids[i],'resource_name':resources_names[i]}
                modified_action_payload['key'] = action_constants.ActionNames.CHANGE_OWNER_OF_FILE.value
                modified_action_payload['log_id'] = log_entry.log_id
                messaging.trigger_post_event(urls.INITIATE_ACTION_PATH, auth_token, None, modified_action_payload)
    elif action_key == action_constants.ActionNames.MAKE_MULTIPLE_RESOURCES_PRIVATE.value:
        resources_ids = action_parameters['resources_ids']
        resources_names = action_parameters['resources_names']
        status_message = 'Action submitted successfully'
        log_entry.status = action_constants.ActionStatus.SUCCESS.value
        response_msg = ResponseMessage(200, status_message)  
        if len(resources_ids)>0:
            for i,resource_id in enumerate(resources_ids):
                modified_action_payload = dict(action_payload)
                modified_action_payload['parameters'] = {'resource_id':resource_id,'resource_name':resources_names[i]}
                modified_action_payload['key'] = action_constants.ActionNames.MAKE_RESOURCE_PRIVATE.value
                modified_action_payload['log_id'] = log_entry.log_id
                messaging.trigger_post_event(urls.INITIATE_ACTION_PATH, auth_token, None, modified_action_payload)
    elif action_key == action_constants.ActionNames.REMOVE_EXTERNAL_ACCESS_TO_MULIPLE_RESOURCES.value:
        resources_ids = action_parameters['resources_ids']
        resources_names = action_parameters['resources_names']
        status_message = 'Action submitted successfully'
        log_entry.status = action_constants.ActionStatus.SUCCESS.value
        response_msg = ResponseMessage(200, status_message)  
        if len(resources_ids)>0:
            for i,resource_id in enumerate(resources_ids):
                modified_action_payload = dict(action_payload)
                modified_action_payload['parameters'] = {'resource_id':resource_id,'resource_name':resources_names[i]}
                modified_action_payload['key'] = action_constants.ActionNames.REMOVE_EXTERNAL_ACCESS_TO_RESOURCE.value
                modified_action_payload['log_id'] = log_entry.log_id
                messaging.trigger_post_event(urls.INITIATE_ACTION_PATH, auth_token, None, modified_action_payload)            
    # multi-select apps view actions
    elif action_key == action_constants.ActionNames.REMOVE_MULTIPLE_APPS_FOR_DOMAIN.value:
        apps_ids = action_parameters["apps_ids"]
        apps_names = action_parameters["apps_names"]
        log_entry.status = action_constants.ActionStatus.SUCCESS.value
        response_msg = ResponseMessage(200, status_message)  
        if len(apps_ids)>0:
            for i,app_id in enumerate(apps_ids):
                modified_action_payload = dict(action_payload)
                modified_action_payload['parameters'] = {'app_id':app_id,'app_name':apps_names[i]}
                modified_action_payload['key'] = action_constants.ActionNames.REMOVE_APP_FOR_DOMAIN.value
                modified_action_payload['log_id'] = log_entry.log_id
                messaging.trigger_post_event(urls.INITIATE_ACTION_PATH, auth_token, None, modified_action_payload) 
    return response_msg


def validate_action_parameters(action_config, action_parameters):
    config_params = action_config["parameters"]
    for param in config_params:
        key = param['key']
        if key not in action_parameters:
            return False
    return True


def audit_action(domain_id, datasource_id, initiated_by, action_config, action_parameters):
    db_session = db_connection().get_session()
    audit_log = AuditLog()
    audit_log.domain_id = domain_id
    audit_log.datasource_id = datasource_id
    audit_log.initiated_by = initiated_by
    audit_log.action_name = pystache.render(
        action_config["description"], action_parameters)
    audit_log.parameters = json.dumps(action_parameters)
    audit_log.timestamp = str(datetime.utcnow().isoformat())
    audit_log.affected_entity = ""
    audit_log.affected_entity_type = ""
    audit_log.status = action_constants.ActionStatus.STARTED.value
    audit_log.message = "Action execution in progress"
    action_key = action_config["key"]
    if action_key == action_constants.ActionNames.ADD_USER_TO_GROUP.value:
        audit_log.affected_entity = action_parameters['user_email']
        audit_log.affected_entity_type = "User"
    elif action_key == action_constants.ActionNames.REMOVE_USER_FROM_GROUP.value:
        audit_log.affected_entity = action_parameters['user_email']
        audit_log.affected_entity_type = "User"
    elif action_key == action_constants.ActionNames.TRANSFER_OWNERSHIP.value:
        audit_log.affected_entity = action_parameters['old_owner_email']
        audit_log.affected_entity_type = "User"
    elif action_key == action_constants.ActionNames.CHANGE_OWNER_OF_FILE.value:
        audit_log.affected_entity = action_parameters['old_owner_email']
        audit_log.affected_entity_type = "Document"
    elif action_key == action_constants.ActionNames.MAKE_RESOURCE_PRIVATE.value:
        audit_log.affected_entity = action_parameters['resource_id']
        audit_log.affected_entity_type = "Document"
    elif action_key == action_constants.ActionNames.MAKE_ALL_FILES_PRIVATE.value:
        audit_log.affected_entity = action_parameters['user_email']
        audit_log.affected_entity_type = "Document"
    elif action_key == action_constants.ActionNames.REMOVE_EXTERNAL_ACCESS_TO_RESOURCE.value:
        audit_log.affected_entity = action_parameters['resource_id']
        audit_log.affected_entity_type = "Document"
    elif action_key == action_constants.ActionNames.REMOVE_EXTERNAL_ACCESS.value:
        audit_log.affected_entity = action_parameters['user_email']
        audit_log.affected_entity_type = "Document"
    elif action_key == action_constants.ActionNames.UPDATE_PERMISSION_FOR_USER.value:
        audit_log.affected_entity = action_parameters['user_email']
        audit_log.affected_entity_type = "Document"
    elif action_key == action_constants.ActionNames.DELETE_PERMISSION_FOR_USER.value:
        audit_log.affected_entity = action_parameters['user_email']
        audit_log.affected_entity_type = "Document"
    elif action_key == action_constants.ActionNames.REMOVE_ALL_ACCESS_FOR_USER.value:
        audit_log.affected_entity = action_parameters['user_email']
        audit_log.affected_entity_type = "Document"
    elif action_key == action_constants.ActionNames.WATCH_ALL_ACTION_FOR_USER.value:
        audit_log.affected_entity = action_parameters['user_email']
        audit_log.affected_entity_type = "User"
    elif action_key == action_constants.ActionNames.ADD_PERMISSION_FOR_A_FILE.value:
        audit_log.affected_entity = action_parameters['user_email']
        audit_log.affected_entity_type = "Document"
    elif action_key == action_constants.ActionNames.NOTIFY_USER_FOR_CLEANUP.value:
        audit_log.affected_entity = action_parameters['user_email']
        audit_log.affected_entity_type = "User"
    elif action_key == action_constants.ActionNames.REMOVE_ALL_ACCESS_FOR_MULTIPLE_USERS.value:
        audit_log.affected_entity = ','.join(action_parameters['users_email'])
        audit_log.affected_entity_type = "Document"    
    elif action_key == action_constants.ActionNames.NOTIFY_MULTIPLE_USERS_FOR_CLEANUP.value:
        audit_log.affected_entity = ','.join(action_parameters['users_email'])
        audit_log.affected_entity_type = "User"   
    elif action_key == action_constants.ActionNames.CHANGE_OWNER_OF_MULIPLE_FILES.value:
        audit_log.affected_entity = ','.join(action_parameters['old_owner_emails'])
        audit_log.affected_entity_type = "Document"   
    elif action_key == action_constants.ActionNames.REMOVE_EXTERNAL_ACCESS_TO_MULIPLE_RESOURCES.value:
        audit_log.affected_entity = ','.join(action_parameters['resources_ids'])
        audit_log.affected_entity_type = "Document"   
    elif action_key == action_constants.ActionNames.MAKE_MULTIPLE_RESOURCES_PRIVATE.value:
        audit_log.affected_entity = ','.join(action_parameters['resources_ids'])
        audit_log.affected_entity_type = "Document"               



    db_session.add(audit_log)
    db_connection().commit()
    return audit_log


def revoke_user_app_access(auth_token, datasource_id, user_email, app_id, log_entry):
    try:
        directory_service = gutils.get_directory_service(auth_token)
        db_session = db_connection().get_session()
        client_query = db_session.query(ApplicationUserAssociation).filter(ApplicationUserAssociation.application_id == app_id,
                                                                           ApplicationUserAssociation.datasource_id == datasource_id, ApplicationUserAssociation.user_email == user_email).first()
        if not client_query:
            log_entry.status = action_constants.ActionStatus.SUCCESS.value
            log_entry.message = "Action completed - Nothing to update"
            return response_messages.ResponseMessage(200, log_entry.message)
        client_id = client_query.client_id
        directory_service.tokens().delete(userKey=user_email, clientId=client_id).execute()
        db_session = db_connection().get_session()
        db_session.query(ApplicationUserAssociation).filter(
            and_(ApplicationUserAssociation.datasource_id == datasource_id,
                 ApplicationUserAssociation.user_email == user_email,
                 ApplicationUserAssociation.application_id == app_id)).delete()

        # check if app is associated with any user
        app_user_association = db_session.query(ApplicationUserAssociation).filter(
            and_(ApplicationUserAssociation.datasource_id == datasource_id,
                 ApplicationUserAssociation.application_id == app_id)).count()

        # if no user is associated with app, than remove the app also
        if app_user_association < 1:
            db_session.query(Application).filter(
                and_(Application.id == app_id)).delete()

        log_entry.status = action_constants.ActionStatus.SUCCESS.value
        status_message = "Action completed successfully"
        log_entry.message = status_message
        return response_messages.ResponseMessage(200, status_message)
    except Exception as ex:
        Logger().exception("Exception occurred while deleting app for datasource_id: " + str(
            datasource_id) + " and user_email: " + str(user_email))
        log_entry.status = action_constants.ActionStatus.FAILED.value
        status_message = "Action failed"
        log_entry.message = status_message
        return response_messages.ResponseMessage(400, status_message)


def remove_app_for_domain(auth_token, app_id, log_entry=None):
    if not auth_token:
        return None
    db_session = db_connection().get_session()
    try:
        directory_service = gutils.get_directory_service(auth_token)
        app_users_query = db_session.query(ApplicationUserAssociation).filter(ApplicationUserAssociation.application_id == app_id)
        app_users = app_users_query.all()
        for app_user in app_users:
            directory_service.tokens().delete(userKey=app_user.user_email, clientId=app_user.client_id).execute()
        app_users_query.delete()
        db_session.query(Application).filter(Application.id == app_id).delete()
    except:
        Logger().exception("Exception occured while deleting the app")

    status_message = "Action completed successfully"
    if log_entry:
        log_entry.status = action_constants.ActionStatus.SUCCESS.value
        log_entry.message = status_message
        db_connection().commit()
    return response_messages.ResponseMessage(200, status_message)
