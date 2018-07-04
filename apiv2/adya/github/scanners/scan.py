
from adya.common.utils.response_messages import Logger
from adya.common.utils import messaging
from adya.common.constants import urls, constants
from adya.common.db.db_utils import db_connection
from adya.common.db.models import DatasourceCredentials, DomainUser, DataSource, Resource, ResourcePermission, alchemy_encoder
from adya.github.github_utils import is_external_user
from github import Github
from datetime import datetime
import json

def start_github_scan(auth_token, datasource_id, domain_id):
    Logger().info("Received the request to start a github scan for domain_id {0} datasource_id {1}".\
        format(domain_id, datasource_id))

    query_params = { "datasource_id": datasource_id, "domain_id": domain_id }
    messaging.trigger_get_event(urls.GITHUB_SCAN_USERS, auth_token, query_params, "github")

def get_github_users(auth_token, datasource_id, domain_id):
    try:
        db_session = db_connection().get_session()
        credentials = db_session.query(DatasourceCredentials.credentials).filter(DatasourceCredentials.datasource_id == datasource_id).first()
        credentials = json.loads(credentials.credentials)
        access_token = credentials["token"]
        git = Github(access_token)
        authenticated_user = git.get_user()
        all_members = []
        query_params = {
                'datasource_id': datasource_id,
                'domain_id': domain_id
            }

        for repo in authenticated_user.get_repos():
            #making a post call to process repositories
            print "Repo name: {0}".format(repo.name)
            resource_data = {}
            resource_data["repository"] = repo.raw_data
            get_and_update_scan_count(datasource_id, DataSource.total_file_count, 1, auth_token, True)
            messaging.trigger_post_event(urls.GITHUB_SCAN_REPOSITORY, auth_token, query_params, resource_data, "github")

            #Processing collaborators under the repository
            members = []
            for collaborator in repo.get_collaborators():
                print "Collaborator name: {0}, site admin: {1}".format(collaborator.name, collaborator.site_admin)
                if collaborator not in all_members:
                    all_members.append(collaborator)
                    members.append(collaborator.raw_data)
            
            members_data = {}
            members_data["members"] = members
            members_count = len(members)
            if not members_count:
                continue
            get_and_update_scan_count(datasource_id, DataSource.total_user_count, members_count, auth_token, True)
            messaging.trigger_post_event(urls.GITHUB_SCAN_USERS, auth_token, query_params, members_data, "github")
        get_and_update_scan_count(datasource_id, DataSource.user_scan_status, 1, auth_token, True)
        get_and_update_scan_count(datasource_id, DataSource.file_scan_status, 1, auth_token, True)
    
    except Exception as ex:
        print ex

def process_github_users(auth_token, datasource_id, domain_id, members_data):
    db_session = db_connection().get_session()
    print "Inside process users"
    members = members_data["members"]
    member_list = []
    processed_members_count = 0
    for member in members:
        member_info = {}
        member_info["datasource_id"] = datasource_id
        member_email = "{0}+{1}@users.noreply.github.com".format(member["id"], member["login"])
        member_info["email"] = member["email"] if member["email"] else member_email 
        member_info["full_name"] = member["name"] if member["name"] else member["login"]
        member_info["first_name"] = member["name"].split(" ")[0] if member["name"] else None
        member_info["last_name"] = member["name"].split(" ")[1] if member["name"] else None
        member_info["type"] = constants.DirectoryEntityType.USER.value if member["type"] == "User" else None
        creation_time = member["created_at"]
        creation_time = datetime.strptime(member["created_at"], "%Y-%m-%dT%H:%M:%SZ")
        updation_time = datetime.strptime(member["updated_at"], "%Y-%m-%dT%H:%M:%SZ")
        member_info["creation_time"] = creation_time
        member_info["last_updated"] = updation_time
        member_info["photo_url"] = member["avatar_url"]
        member_info["user_id"] = member["id"]
        member_info["member_type"] = constants.EntityExposureType.INTERNAL.value

        if is_external_user(domain_id, member_info["email"]):
            member_info["member_type"] = constants.EntityExposureType.EXTERNAL.value
        
        member_list.append(member_info)
        processed_members_count = processed_members_count + 1

    try:
        db_session.bulk_insert_mappings(DomainUser, member_list)
        db_connection().commit()
        get_and_update_scan_count(datasource_id, DataSource.processed_user_count, processed_members_count, auth_token, True)
    
    except Exception as ex:
        print ex
        db_session.rollback()

def process_github_repository(auth_token, datasource_id, domain_id, resource_data):
    #Process the github repositories here
    #print "Repository received : {0}".format(resource_data["repository"])
    db_session = db_connection().get_session()
    
    repository_data = resource_data["repository"]
    resource = Resource()
    resource.datasource_id = datasource_id
    resource.resource_id = repository_data["id"]
    resource.resource_name = repository_data["full_name"]
    resource.resource_size = repository_data["size"]
    creation_time = datetime.strptime(repository_data["created_at"], "%Y-%m-%dT%H:%M:%SZ")
    last_modified_time = datetime.strptime(repository_data["pushed_at"], "%Y-%m-%dT%H:%M:%SZ")
    resource.last_modified_time = last_modified_time
    resource.creation_time = creation_time
    resource.description = repository_data["description"]
    resource.parent_id = repository_data["parent"]["id"] if repository_data["fork"] else None
    owner_email = "{0}+{1}@users.noreply.github.com".format(repository_data["owner"]["id"], repository_data["owner"]["login"])
    resource.resource_owner_id = owner_email
    resource.exposure_type = constants.EntityExposureType.PRIVATE.value if repository_data["private"] else constants.EntityExposureType.PUBLIC.value

    resource_permission = ResourcePermission()
    resource_permission.datasource_id = datasource_id
    resource_permission.resource_id = repository_data["id"]
    resource_permission.email = owner_email
    resource_permission.permission_id = repository_data["owner"]["id"]
    resource_permission.exposure_type = constants.EntityExposureType.PRIVATE.value if repository_data["private"] else constants.EntityExposureType.PUBLIC.value

    if repository_data["permissions"]:
        permissions = repository_data["permissions"]
        if permissions["admin"]:
            resource_permission.permission_type = constants.Role.ADMIN.value
        elif permissions["push"]:
            resource_permission.permission_type = constants.Role.WRITER.value
        else:
            resource_permission.permission_type = constants.Role.READER.value
    
    db_session.add(resource)
    db_session.add(resource_permission)
    
    try:
        db_connection().commit()
        get_and_update_scan_count(datasource_id, DataSource.processed_file_count, 1, auth_token, True)
    
    except Exception as ex:
        print ex
        db_session.rollback()

def get_and_update_scan_count(datasource_id, column_name, column_value, auth_token, send_message=None):
    db_session = db_connection().get_session()
    rows_updated = 0
    try:
        rows_updated = db_session.query(DataSource).filter(DataSource.datasource_id == datasource_id).\
            update({column_name: column_name + column_value})
        db_connection().commit()
    except Exception as ex:
        print ex
        db_session.rollback()
    
    if rows_updated == 1:
        datasource = db_session.query(DataSource).filter(DataSource.datasource_id == datasource_id, 
            DataSource.is_async_delete == False).first()
        if send_message:
            messaging.send_push_notification("adya-scan-update", json.dumps(datasource, cls=alchemy_encoder()))
        if get_scan_status(datasource) == 1:
            #scan_complete
            try:
                db_connection().commit()
            except Exception as ex:
                print ex
            messaging.send_push_notification("adya-scan-update", json.dumps(datasource, cls=alchemy_encoder()))

def get_scan_status(datasource):
    if ((datasource.user_scan_status == 1 and datasource.total_user_count == datasource.processed_user_count) and 
        (datasource.file_scan_status == 1 and datasource.total_file_count == datasource.processed_file_count)):
        return 1  # Complete
    return 0  # In Progress