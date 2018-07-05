

from adya.github import github_utils, github_constants
from adya.common.db.models import DatasourceScanners, Resource, ResourcePermission, DomainUser, DatasourceCredentials
from adya.common.db.connection import db_connection
from adya.common.utils import messaging
from adya.common.constants import urls, constants
import uuid
import datetime
import requests
import json
import time

def query(auth_token, query_params, scanner):
    github_client = github_utils.get_github_client(scanner.datasource_id)
    authenticated_user = github_client.get_user()
    
    # #Listing installations for a user 
    # db_session = db_connection().get_session()
    # credentials = db_session.query(DatasourceCredentials).filter(DatasourceCredentials.datasource_id == scanner.datasource_id).first()
    # credentials = json.loads(credentials.credentials)
    # params = {
    #     'access_token': credentials["token"],
    # }
    # headers = {
    #     'Accept': 'application/vnd.github.machine-man-preview+json',
    #     'Authorization': credentials["token"] + " OAUTH-TOKEN"
    # }
    # response = requests.get("https://api.github.com/user/installations", params=params, headers=headers)
    # print json.loads(response)

    all_repos_dict = {}
    all_orgs_dict = {}
    repos = {}
    orgs = {}
    fetched_repos_count = 0

    #Fetching the repositories under the authenticated_user
    for repo in authenticated_user.get_repos():
        print repo
        if repo.id not in all_repos_dict:
            # all_repos_dict[repo.id] = repo.full_name
            all_repos_dict[repo.id] = repo.raw_data
            fetched_repos_count = fetched_repos_count + 1
            
            #Creating a webhook for the repository
            config = {
                "url": urls.GITHUB_NOTIFICATIONS_URL,
                "content_type": "json" 
            }
            events = ["repository"]
            try:
                repo.create_hook(name="web", config=config, events=events, active=True)
            except Exception as ex:
                print ex
    repos["repo"] = all_repos_dict

    #Fetching the organisations under the authenticated_user
    print "Scanning organizations"
    for org in authenticated_user.get_orgs():
        if org.id not in all_orgs_dict:
            # all_orgs_dict[org.id] = org.login
            all_orgs_dict[org.id] = org.raw_data
    orgs["org"] = all_orgs_dict

    all_entities = []
    all_entities.append(repos)
    all_entities.append(orgs)
    
    return {"payload": all_entities, "repo_count": fetched_repos_count}

def process(db_session, auth_token, query_params, scanner_data):
    #Process the repositories and organisations and initiate members scan here
    all_entities = scanner_data["entities"]
    datasource_id = query_params["datasource_id"]
    domain_id = query_params["domain_id"]
    repos = {}
    orgs = {}

    print "All entities : {}".format(all_entities)
    for entity in all_entities:
        for entity_key in entity:
            if entity_key == "repo":
                repos = entity[entity_key]
            elif entity_key == "org":
                orgs = entity[entity_key]
    
    github_client = github_utils.get_github_client(datasource_id)
    authenticated_user = github_client.get_user()
    user_email = authenticated_user.email if authenticated_user.email else "{0}+{1}@users.noreply.github.com".format(authenticated_user.id, authenticated_user.login)

    #Update the Resource table and ResourcePermission table with the repository entries
    repo_list = []
    repo_permission_list = []
    processed_repo_count = 0

    for repo in repos:
        repo = repos[repo]
        repo_dict = {}
        repo_dict["datasource_id"] = datasource_id
        repo_dict["resource_id"] = repo["id"]
        repo_dict["resource_name"] = repo["full_name"]
        repo_dict["resource_size"] = repo["size"]
        creation_time = datetime.datetime.strptime(repo["created_at"], "%Y-%m-%dT%H:%M:%SZ")
        last_modified_time = datetime.datetime.strptime(repo["pushed_at"], "%Y-%m-%dT%H:%M:%SZ")
        repo_dict["last_modified_time"] = last_modified_time
        repo_dict["creation_time"] = creation_time
        repo_dict["description"] = repo["description"]
        repo_dict["parent_id"] = repo["parent"]["id"] if repo["fork"] else None
        owner_email = "{0}+{1}@users.noreply.github.com".format(repo["owner"]["id"], repo["owner"]["login"])
        repo_dict["resource_owner_id"] = owner_email
        repo_dict["exposure_type"] = constants.EntityExposureType.PRIVATE.value if repo["private"] else constants.EntityExposureType.PUBLIC.value
        repo_dict["resource_type"] = "repository"

        repo_permission_dict = {}
        repo_permission_dict["datasource_id"] = datasource_id
        repo_permission_dict["resource_id"] = repo["id"]
        repo_permission_dict["email"] = owner_email
        repo_permission_dict["permission_id"] = repo["owner"]["id"]
        repo_permission_dict["exposure_type"] = constants.EntityExposureType.INTERNAL.value

        if repo["permissions"]:
            permissions = repo["permissions"]
            if permissions["admin"]:
                repo_permission_dict["permission_type"] = constants.Role.OWNER.value
            elif permissions["push"]:
                repo_permission_dict["permission_type"] = constants.Role.WRITER.value
            else:
                repo_permission_dict["permission_type"] = constants.Role.READER.value
        
        repo_list.append(repo_dict)
        repo_permission_list.append(repo_permission_dict)
        processed_repo_count = processed_repo_count + 1

        #Starting a scanner for each repository
        scanner = DatasourceScanners()
        scanner.datasource_id = datasource_id
        scanner.scanner_type = github_constants.ScannerTypes.REPOSITORIES.value
        scanner.channel_id = str(uuid.uuid4())
        scanner.user_email = user_email
        scanner.started_at = datetime.datetime.now()
        scanner.in_progress = 1
        db_session.add(scanner)
        db_connection().commit()
        query_params = {"datasource_id": datasource_id, "domain_id": domain_id, "repo_name": repo["full_name"], "scanner_id": scanner.id, "change_type": github_constants.AppChangedTypes.ADDED.value, "repo_id": repo["id"]}
        messaging.trigger_get_event(urls.GITHUB_SCAN_ENTITIES, auth_token, query_params, "github")
        time.sleep(0.01)

    if len(repo_list) > 0 and len(repo_permission_list) > 0:
        try:
            db_session.bulk_insert_mappings(Resource, repo_list)
            db_session.bulk_insert_mappings(ResourcePermission, repo_permission_list)
            db_connection().commit()
        
        except Exception as ex:
            print ex
            db_session.rollback()

    #Update the Domain user table with the organisation entries
    print "orgs dict : {}".format(orgs)
    all_orgs = []
    for org in orgs:
        org = orgs[org]
        org_info = {}
        org_info["datasource_id"] = datasource_id
        org_info["full_name"] = org["name"]
        name_split = org_info["full_name"].split(" ")
        if len(name_split) > 1:
            org_info["first_name"] = name_split[0]
            org_info["last_name"] = name_split[1]
        else:
            org_info["first_name"] = name_split[0]
            org_info["last_name"] = ''
        org_email = "{0}+{1}@users.noreply.github.com".format(org["id"], org["login"])
        org_info["email"] = org["email"] if org["email"] else org_email
        org_info["description"] = org["description"]
        org_info["type"] = constants.DirectoryEntityType.GROUP.value
        org_info["creation_time"] = datetime.datetime.strptime(org["created_at"], "%Y-%m-%dT%H:%M:%SZ")
        org_info["last_updated"] = datetime.datetime.strptime(org["updated_at"], "%Y-%m-%dT%H:%M:%SZ")
        org_info["user_id"] = org["id"]
        org_info["member_type"] = constants.EntityExposureType.INTERNAL.value

        all_orgs.append(org_info)

        #Starting a scanner for each organization
        scanner = DatasourceScanners()
        scanner.datasource_id = datasource_id
        scanner.scanner_type = github_constants.ScannerTypes.ORGANISATIONS.value
        scanner.channel_id = str(uuid.uuid4())
        scanner.user_email = user_email
        scanner.started_at = datetime.datetime.now()
        scanner.in_progress = 1
        db_session.add(scanner)
        db_connection().commit()
        query_params = {"datasource_id": datasource_id, "domain_id": domain_id, "org_name": org["login"], "scanner_id": scanner.id, "change_type": github_constants.AppChangedTypes.ADDED.value}
        messaging.trigger_get_event(urls.GITHUB_SCAN_ENTITIES, auth_token, query_params, "github")
        time.sleep(0.01)

    if len(all_orgs) > 0:
        try:
            db_session.bulk_insert_mappings(DomainUser, all_orgs)
            db_connection().commit()

        except Exception as ex:
            print ex
            db_session.rollback()
    
    return processed_repo_count