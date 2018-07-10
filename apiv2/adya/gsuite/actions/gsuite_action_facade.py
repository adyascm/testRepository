import json

from adya.common.constants import action_constants, constants
from adya.gsuite.actions import gsuite_actions
from adya.common.db.models import AuditLog
from adya.common.utils import response_messages
from adya.common.db.connection import db_connection
from sqlalchemy import and_

def execute_action(auth_token, payload):
    action_type = payload['action_type']
    user_email = payload['user_email']
    datasource_id = payload['datasource_id']
    domain_id = payload['domain_id']
    initiated_by_email = payload['initiated_by_email'] if 'initiated_by_email' in payload else None
    permissions = json.loads(payload['permissions']) if 'permissions' in payload else None
    exceptions = None
    response = None

    if action_type == action_constants.ActionNames.ADD_USER_TO_GROUP.value:
        group_email = payload['group_email']
        response = gsuite_actions.add_user_to_group(auth_token, group_email, user_email)
    elif action_type == action_constants.ActionNames.REMOVE_USER_FROM_GROUP.value:
        group_email = payload['group_email']
        response = gsuite_actions.delete_user_from_group(auth_token, group_email, user_email)
    elif action_type == action_constants.ActionNames.DELETE_PERMISSION_FOR_USER.value or \
                    action_type == action_constants.ActionNames.REMOVE_ALL_ACCESS_FOR_USER.value or \
                    action_type == action_constants.ActionNames.MAKE_ALL_FILES_PRIVATE.value or \
                    action_type == action_constants.ActionNames.MAKE_RESOURCE_PRIVATE.value or \
                    action_type == action_constants.ActionNames.REMOVE_EXTERNAL_ACCESS.value or \
                    action_type == action_constants.ActionNames.REMOVE_EXTERNAL_ACCESS_TO_RESOURCE.value:
        response = gsuite_actions.delete_permissions(auth_token, permissions, user_email, initiated_by_email, datasource_id)

    elif action_type == action_constants.ActionNames.ADD_PERMISSION_FOR_A_FILE.value or \
                    action_type ==  action_constants.ActionNames.CHANGE_OWNER_OF_FILE.value:
        response = gsuite_actions.add_permissions(auth_token, permissions, user_email, initiated_by_email, datasource_id, domain_id)

    elif action_type == action_constants.ActionNames.UPDATE_PERMISSION_FOR_USER.value:
        response = gsuite_actions.update_permissions(auth_token, permissions, user_email, initiated_by_email, datasource_id)
    elif action_type == action_constants.ActionNames.TRANSFER_OWNERSHIP.value:
        new_owner_email = payload['new_owner_email']
        response = gsuite_actions.transfer_ownership(auth_token, user_email, new_owner_email)

    #Update the audit log
    if 'log_id' in payload:
        log_id = payload['log_id']
        db_session = db_connection().get_session()
        current_log = db_session.query(AuditLog).filter(and_(AuditLog.log_id == log_id, AuditLog.status != action_constants.ActionStatus.FAILED.value)).first()
        if current_log:
            response_code = response.get_response_code()
            if response_code == 200:
                current_log.success_count += 1
                if current_log.success_count == current_log.total_count:
                    current_log.status = action_constants.ActionStatus.SUCCESS.value
                    current_log.message = "Action completed successfully"
            else:
                current_log.failed_count += 1
                current_log.status = action_constants.ActionStatus.FAILED.value
                current_log.message = "Action failed"
            
            db_connection().commit()

    return response
