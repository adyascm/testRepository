

from adya.common.constants import action_constants, constants
from adya.github.actions import github_actions
from adya.common.db.connection import db_connection
from adya.common.db.models import Resource, ResourcePermission, DomainUser, AuditLog
from adya.github import github_utils
from sqlalchemy import and_
import json

def execute_github_actions(auth_token, payload):
    #Differentiate between actions and perform them
    resource_name = payload["resource_name"]
    db_session = db_connection().get_session()

    action_type = payload['action_type']
    user_email = payload['user_email']
    datasource_id = payload['datasource_id']
    domain_id = payload['domain_id']
    more_to_execute = payload['more_to_execute'] if 'more_to_execute' in payload else 0
    initiated_by_email = payload['initiated_by_email'] if 'initiated_by_email' in payload else None
    permissions = json.loads(payload['permissions']) if 'permissions' in payload else []

    response = None

    if action_type == action_constants.ActionNames.DELETE_REPOSITORY.value:
        response = github_actions.delete_repository(auth_token, resource_name, datasource_id)
        #Deleting the repository from the Resources table
        resource_obj = db_session.query(Resource).filter(Resource.datasource_id == datasource_id).first()
        db_session.query(Resource).filter(Resource.datasource_id == datasource_id, Resource.resource_name == resource_name).delete()
        db_session.query(ResourcePermission).filter(ResourcePermission.datasource_id == datasource_id, ResourcePermission.resource_id == resource_obj.resource_id).delete()
        try:
            db_connection().commit()
            response["action_status"] = constants.ResponseType.SUCCESS.value
        except Exception as ex:
            print ex
            db_session.rollback()
            response["action_status"] = constants.ResponseType.ERROR.value

    elif action_type == action_constants.ActionNames.DELETE_PERMISSION_FOR_USER.value or \
                    action_type == action_constants.ActionNames.REMOVE_ALL_ACCESS_FOR_USER.value or \
                    action_type == action_constants.ActionNames.MAKE_ALL_FILES_PRIVATE.value or \
                    action_type == action_constants.ActionNames.MAKE_RESOURCE_PRIVATE.value or \
                    action_type == action_constants.ActionNames.REMOVE_EXTERNAL_ACCESS.value or \
                    action_type == action_constants.ActionNames.REMOVE_EXTERNAL_ACCESS_TO_RESOURCE.value:
        #Delete the collaborator from the repository
        response = github_actions.delete_permissions(auth_token, permissions, user_email, initiated_by_email, datasource_id)
        
        #Update the audit log
    if 'log_id' in payload:
        log_id = payload['log_id']
        db_session = db_connection().get_session()
        current_log = db_session.query(AuditLog).filter(and_(AuditLog.log_id == log_id, AuditLog.status != action_constants.ActionStatus.FAILED.value)).first()
        if current_log:
            response_code = response.get_response_code()
            perm_length = len(permissions)
            if response_code != 200:
                current_log.failed_count += perm_length
                current_log.status = action_constants.ActionStatus.FAILED.value
                current_log.message = "Action failed"
            else:
                current_log.success_count += perm_length
                if current_log.failed_count < 1:
                    if not more_to_execute:
                        current_log.total_count = current_log.success_count
                        
                    current_log.status = action_constants.ActionStatus.SUCCESS.value
                    percentage_successful_till_now = ((current_log.success_count*100)/max(current_log.total_count, current_log.success_count))
                    current_log.message = "Action status - {} pct completed".format(percentage_successful_till_now)
                                    
            db_connection().commit()

    return response