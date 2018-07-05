

from adya.common.constants import action_constants, constants
from adya.github.actions import github_actions
from adya.common.db.connection import db_connection
from adya.common.db.models import Resource, ResourcePermission, DomainUser, DatasourceCredentials
from adya.github import github_utils
import json

def execute_github_actions(auth_token, payload):
    #Differentiate between actions and perform them
    resource_name = payload["resource_name"]
    action_type = payload["action_type"]
    datasource_id = payload["datasource_id"]
    #domain_id = payload["domain_id"]
    db_session = db_connection().get_session()
    datasource_credentials = db_session.query(DatasourceCredentials).filter(DatasourceCredentials.datasource_id == datasource_id).first()
    datasource_credentials = json.loads(datasource_credentials.credentials)
    domain_id = datasource_credentials["domain_id"]

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
    
    elif action_type == action_constants.ActionNames.REMOVE_EXTERNAL_USER_AS_COLLABORATOR.value:
        #remove external collaborators
        repo_id = github_actions.remove_external_collaborators(auth_token, resource_name, datasource_id, domain_id)
        #Deleting the external collaborators from the Resource Permissions table
        resource_permissions = db_session.query(ResourcePermission).filter(ResourcePermission.datasource_id == datasource_id, ResourcePermission.resource_id == repo_id).all()
        external_collaborators = []

        for permission in resource_permissions:
            if github_utils.is_external_user(domain_id, permission.email):
                external_collaborators.append(permission)

        response = {}
        try:
            for collaborator in external_collaborators:
                db_session.delete(collaborator)
            db_connection().commit()
            response["action_status"] = constants.ResponseType.SUCCESS.value
        except Exception as ex:
            print ex
            db_session.rollback()
            response["action_status"] = constants.ResponseType.ERROR.value

    return response