from adya.common.utils.response_messages import Logger
from adya.common.utils import messaging
from adya.common.constants import urls, constants
from adya.common.db.db_utils import db_connection
from adya.common.db.models import DatasourceCredentials, DomainUser, DataSource, Resource, ResourcePermission, DatasourceScanners, alchemy_encoder
from adya.github import github_utils
from github import Github
from datetime import datetime
import json


def query(auth_token, query_params, scanner):
    datasource_id = query_params["datasource_id"]
    repo_name = query_params["repo_name"]
    github_client = github_utils.get_github_client(datasource_id)
    all_collaborators = []
    collaborators_list = []
    repo = github_client.get_repo(repo_name)
    for collaborator in repo.get_collaborators():
        if collaborator not in all_collaborators:
            print collaborator.name
            all_collaborators.append(collaborator)
            collaborators_list.append(collaborator.raw_data)
    
    #Priting the hooks associated with the repository
    try:
        for webhook in repo.get_hooks():
            print "webhook name : {0}".format(webhook.name)
    except Exception as ex:
        print ex
    
    return {"payload": collaborators_list}

def process(db_session, auth_token, query_params, scanner_data):
    collaborators_list = scanner_data["entities"]
    datasource_id = query_params["datasource_id"]
    scanner_id = query_params["scanner_id"]
    domain_id = query_params["domain_id"]
    all_collaborators = []
    processed_collaborators_count = 0

    # existing_collaborators = db_session.query(DomainUser).filter(DomainUser.datasource_id == DatasourceScanners.datasource_id). \
    #     filter(DatasourceScanners.scanner_id == scanner_id, DatasourceScanners.datasource_id == datasource_id).all()

    # print existing_collaborators
    
    for collaborator in collaborators_list:
        collaborator_info = {}
        collaborator_info["datasource_id"] = datasource_id
        user_email = "{0}+{1}@users.noreply.github.com".format(collaborator["id"], collaborator["login"])
        collaborator_info["email"] = collaborator["email"] if collaborator["email"] else user_email
        collaborator_info["full_name"] = collaborator["name"] if collaborator["name"] else collaborator["login"]
        name_split = collaborator_info["full_name"].split(" ")
        if len(name_split) > 1:
            collaborator_info["first_name"] = name_split[0]
            collaborator_info["last_name"] = name_split[1]
        else:
            collaborator_info["first_name"] = name_split[0]
            collaborator_info["last_name"] = ''
        creation_time = datetime.strptime(collaborator["created_at"], "%Y-%m-%dT%H:%M:%SZ")
        updation_time = datetime.strptime(collaborator["updated_at"], "%Y-%m-%dT%H:%M:%SZ")
        collaborator_info["creation_time"] = creation_time
        collaborator_info["last_updated"] = updation_time
        collaborator_info["photo_url"] = collaborator["avatar_url"]
        collaborator_info["user_id"] = collaborator["id"]
        collaborator_info["member_type"] = constants.EntityExposureType.INTERNAL.value

        if github_utils.is_external_user(domain_id, collaborator_info["email"]):
            collaborator_info["member_type"] = constants.EntityExposureType.EXTERNAL.value
        
        all_collaborators.append(collaborator_info)
        processed_collaborators_count = processed_collaborators_count + 1

    try:
        #db_session.bulk_insert_mappings(DomainUser, all_collaborators)
        db_session.execute(DomainUser.__table__.insert().prefix_with("IGNORE").values(all_collaborators))
        db_connection().commit()
        return processed_collaborators_count
    
    except Exception as ex:
        print ex
        db_session.rollback()