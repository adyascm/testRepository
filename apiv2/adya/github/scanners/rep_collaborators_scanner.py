from adya.common.utils.response_messages import Logger
from adya.common.utils import messaging, utils
from adya.common.constants import urls, constants
from adya.common.db.db_utils import db_connection
from adya.common.db.models import DatasourceCredentials, DomainUser, DataSource, Resource, ResourcePermission, DatasourceScanners, alchemy_encoder
from adya.github import github_utils
from adya.common.utils.response_messages import Logger
from datetime import datetime
import json, github


def query(auth_token, query_params, scanner):
    datasource_id = query_params["dataSourceId"]
    repo_name = query_params["repo_name"]
    github_client = github_utils.get_github_client(datasource_id)
    collaborators_list = []
    #collaborator_permissions_dict = {}
    repo = github_client.get_repo(repo_name)
    if repo:
        for collaborator in repo.get_collaborators():
            collaborator.raw_data["permission_type"] = constants.Role.READER.value
            if collaborator.permissions.raw_data:
                if collaborator.permissions.raw_data["admin"]:
                    collaborator.raw_data["permission_type"] = constants.Role.OWNER.value
                elif collaborator.permissions.raw_data["push"]:
                    collaborator.raw_data["permission_type"] = constants.Role.WRITER.value
            collaborators_list.append(collaborator.raw_data)

        #Creating a webhook for the repository
        if not constants.DEPLOYMENT_ENV == "local":
            try:
                config = {
                    "url": urls.GITHUB_NOTIFICATIONS_URL,
                    "content_type": "json" 
                }
                events = ["repository","repository_vulnerability_alert","fork","member","public","push","create"]
                repo.create_hook(name="web", config=config, events=events, active=True)
            except (github.GithubException, Exception) as ex:
                Logger().exception("Exception occurred while subscribing for push notification for repository = {} with exception - {}".format(repo_name, ex))

    return {"payload": collaborators_list}

def process(db_session, auth_token, query_params, scanner_data):
    collaborators_list = scanner_data["entities"]
    datasource_id = query_params["dataSourceId"]
    domain_id = query_params["domainId"]
    repo_id = query_params["repo_id"]
    processed_collaborators_count = 0
    max_repository_exposure = constants.EntityExposureType.PRIVATE.value
    new_collaborator_list = []
    new_permission_list = []

    for collaborator in collaborators_list:
        collaborator_info = {}
        collaborator_info["datasource_id"] = datasource_id
        collaborator_info["email"] = collaborator["email"] if collaborator["email"] else github_utils.get_default_github_email(collaborator["id"], collaborator["login"])
        collaborator_info["full_name"] = collaborator["name"] if collaborator["name"] else collaborator["login"]
        name_split = collaborator_info["full_name"].split(" ")
        if len(name_split) > 1:
            collaborator_info["first_name"] = name_split[0]
            collaborator_info["last_name"] = name_split[1]
        else:
            collaborator_info["first_name"] = name_split[0]
            collaborator_info["last_name"] = ''
        collaborator_info["creation_time"] = datetime.strptime(collaborator["created_at"], "%Y-%m-%dT%H:%M:%SZ")
        collaborator_info["last_updated"] = datetime.strptime(collaborator["updated_at"], "%Y-%m-%dT%H:%M:%SZ")
        collaborator_info["photo_url"] = collaborator["avatar_url"]
        collaborator_info["user_id"] = collaborator["id"]
        collaborator_info["member_type"] = constants.EntityExposureType.INTERNAL.value

        if github_utils.is_external_user(domain_id, collaborator_info["email"]):
            collaborator_info["member_type"] = constants.EntityExposureType.EXTERNAL.value
        
        #Update the Resource permissions table for the current repository
        repo_permission_dict = {}
        repo_permission_dict["datasource_id"] = datasource_id
        repo_permission_dict["resource_id"] = repo_id
        repo_permission_dict["email"] = collaborator_info["email"]
        repo_permission_dict["permission_id"] = collaborator["id"]
        repo_permission_dict["exposure_type"] = collaborator_info["member_type"]
        repo_permission_dict["permission_type"] = collaborator["permission_type"]

        max_repository_exposure = utils.get_highest_exposure_type(collaborator_info["member_type"], max_repository_exposure)

        new_collaborator_list.append(collaborator_info)
        new_permission_list.append(repo_permission_dict)
        processed_collaborators_count += 1
    try:
        db_session.execute(DomainUser.__table__.insert().prefix_with("IGNORE").values(new_collaborator_list))
        db_session.execute(ResourcePermission.__table__.insert().prefix_with("IGNORE").values(new_permission_list))
        db_session.query(Resource).filter(Resource.datasource_id == datasource_id, Resource.resource_id == repo_id). \
            update({ Resource.exposure_type: max_repository_exposure })
        db_connection().commit()
    except Exception as ex:
        Logger().exception("Exception occurred while adding respository collaborators with exception - {}".format(ex))
        db_session.rollback()

    return processed_collaborators_count

def post_process(db_session, auth_token, query_params):
    pass