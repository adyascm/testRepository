

from adya.github import github_utils, github_constants
from adya.common.db.models import DatasourceScanners, Resource, ResourcePermission, DomainUser, DatasourceCredentials
from adya.common.db.connection import db_connection
from adya.common.utils import messaging
from adya.common.constants import urls, constants
from adya.common.utils.response_messages import Logger
import uuid
import datetime
import json
import time

def query(auth_token, query_params, scanner):
    github_client = github_utils.get_github_client(scanner.datasource_id)
    authenticated_user = github_client.get_user()
    all_repos= []

    #Fetching the repositories under the authenticated_user
    for repo in authenticated_user.get_repos():
        all_repos.append(repo.raw_data)

    return {"payload": all_repos, "nextPageNumber": None}

def process(db_session, auth_token, query_params, scanner_data):
    #Process the repositories and organisations and initiate members scan here
    all_repos = scanner_data["entities"]
    datasource_id = query_params["dataSourceId"]
    domain_id = query_params["domainId"]

    #Update the Resource table and ResourcePermission table with the repository entries
    repo_list = []
    processed_repo_count = 0

    for repo in all_repos:
        
        owner_email = ''
        repo_owner_obj = repo["owner"]
        print repo_owner_obj
        if "email" in repo_owner_obj:
            owner_email = repo_owner_obj["email"]
        else:
            owner_email = github_utils.get_default_github_email(repo_owner_obj["id"], repo_owner_obj["login"])
        repo_dict = {}
        repo_dict["datasource_id"] = datasource_id
        repo_dict["resource_id"] = repo["id"]
        repo_dict["resource_name"] = repo["full_name"]
        repo_dict["resource_size"] = repo["size"]
        repo_dict["last_modified_time"] = datetime.datetime.strptime(repo["pushed_at"], "%Y-%m-%dT%H:%M:%SZ")
        repo_dict["creation_time"] = datetime.datetime.strptime(repo["created_at"], "%Y-%m-%dT%H:%M:%SZ")
        repo_dict["description"] = repo["description"]
        #TODO: If parent is available, then store parent also
        repo_dict["parent_id"] = repo["parent"]["id"] if repo["fork"] else None
        repo_dict["resource_owner_id"] = owner_email
        repo_dict["exposure_type"] = constants.EntityExposureType.DOMAIN.value if repo["private"] else constants.EntityExposureType.PUBLIC.value
        repo_dict["resource_type"] = "repository"
        repo_list.append(repo_dict)
        processed_repo_count = processed_repo_count + 1
    
    try:
        if len(repo_list) > 0:
            db_session.bulk_insert_mappings(Resource, repo_list)
            db_connection().commit()

            for repo in repo_list:
                #Starting a scanner for each repository
                scanner = DatasourceScanners()
                scanner.datasource_id = datasource_id
                scanner.scanner_type = github_constants.ScannerTypes.REP_COLLABORATORS.value
                scanner.channel_id = str(uuid.uuid4())
                scanner.user_email = repo["resource_owner_id"]
                scanner.started_at = datetime.datetime.utcnow()
                scanner.in_progress = 1
                db_session.add(scanner)
                db_connection().commit()
                query_params = {"dataSourceId": datasource_id, "domainId": domain_id, "repo_name": repo["resource_name"], "scannerId": scanner.id, "repo_id": repo["resource_id"]}
                messaging.trigger_get_event(urls.GITHUB_SCAN_ENTITIES, auth_token, query_params, "github")
    except Exception as ex:
        Logger().exception("Exception occurred while processing repositories with exception - {}".format(ex))
        db_session.rollback()
    return processed_repo_count

def post_process(db_session, auth_token, query_params):
    pass