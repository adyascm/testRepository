from sqlalchemy import and_
from adya.github import github_utils
from adya.common.db.connection import db_connection
from adya.common.db.models import Resource, ResourcePermission, DomainUser, DatasourceCredentials
from adya.common.db import action_utils
from adya.common.utils.response_messages import Logger, ResponseMessage

def delete_repository(auth_token, resource_name, datasource_id):
    #make a github api call to delete repository
    github_client = github_utils.get_github_client(datasource_id)
    repo = github_client.get_repo(resource_name)

    print "Repository to be deleted : {}".format(repo.full_name)
    response = repo.delete()
    return response

def delete_permissions(auth_token, permissions, user_email, initiated_by_email, datasource_id):
    #Remove the collaborator from the repository
    github_client = github_utils.get_github_client(datasource_id)
    db_session = db_connection().get_session()
    repo_by_id = {}
    updated_permissions = {}
    for permission in permissions:
        repo_id = permission["resource_id"]
        if not repo_id in repo_by_id:
            db_repo = db_session.query(Resource).filter(and_(Resource.datasource_id == permission["datasource_id"], Resource.resource_id == repo_id)).first()
            repo = github_client.get_repo(db_repo.resource_name)
            repo_by_id[repo_id] = repo

        repo = repo_by_id[repo_id]
        for collaborator in repo.get_collaborators():
            collaborator_obj = collaborator.raw_data
        
            if str(collaborator_obj["id"]) == permission["permission_id"]:
                #Delete the collaborator
                repo.remove_from_collaborators(collaborator)
                if not permission['resource_id'] in updated_permissions:
                    updated_permissions[permission['resource_id']] = [permission]
                else:
                    updated_permissions[permission['resource_id']].append(permission)
                break

    try:
        print updated_permissions
        action_utils.delete_resource_permission(initiated_by_email, datasource_id, updated_permissions)
    except Exception:
        Logger().exception("Exception occurred while removing permission from db")
        is_success = False

    return ResponseMessage(200, "")

    