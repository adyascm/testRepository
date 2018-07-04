from adya.common.utils.response_messages import Logger
from adya.common.utils import messaging
from adya.common.constants import urls, constants
from adya.common.db.db_utils import db_connection
from adya.common.db.models import DatasourceCredentials, DomainUser, DataSource, Resource, ResourcePermission, alchemy_encoder
from adya.github import github_utils
from github import Github
from datetime import datetime
import json

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
        
        # for org in authenticated_user.get_orgs():
        #     print org.name
        #     members = []
        #     for user in org.get_members():
        #         print user
        #         if user.raw_data not in members:
        #             members.append(user.raw_data)
        #         for repo in user.get_repos():
        #             print repo.name
            
        #     members_data = {}
        #     members_data["members"] = members
        #     members_count = len(members)
        #     if not members_count:
        #         continue
        #     get_and_update_scan_count(datasource_id, DataSource.total_user_count, members_count, auth_token, True)
        #     messaging.trigger_post_event(urls.GITHUB_SCAN_USERS, auth_token, query_params, members_data, "github")
        
        # get_and_update_scan_count(datasource_id, DataSource.user_scan_status, 1, auth_token, True)
        # get_and_update_scan_count(datasource_id, DataSource.file_scan_status, 1, auth_token, True)

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

        if github_utils.is_external_user(domain_id, member_info["email"]):
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

### This module should have only query, process and post_process methods as below

def query(auth_token, query_params, scanner):
    github_client = github_utils.get_github_client(scanner.datasource_id)
    authenticated_user = github_client.get_user()
    all_members = []
    members = []
    print "quering users scanner file"
    try: 
        # for repo in authenticated_user.get_repos():
        #     for collaborator in repo.get_collaborators():
        #         print collaborator.name
        #         if collaborator not in all_members:
        #             all_members.append(collaborator)
        #             members.append(collaborator.raw_data)
        for org in authenticated_user.get_orgs():
            for user in org.get_members():
                print "Scanned user: {0}".format(user.login)
                if user not in all_members:
                    all_members.append(user)
                    members.append(user.raw_data)
    
        return {"payload": members}
    
    except Exception as ex:
        print ex

def process(db_session, auth_token, query_params, scanner_data):
    print "Processing users scanner file"
    members = scanner_data["entities"]
    member_list = []
    datasource_id = query_params["datasource_id"]
    domain_id = query_params["domain_id"]
    members_count = 0

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

        if github_utils.is_external_user(domain_id, member_info["email"]):
            member_info["member_type"] = constants.EntityExposureType.EXTERNAL.value
        
        member_list.append(member_info)
        members_count = members_count + 1

    try:
        db_session.bulk_insert_mappings(DomainUser, member_list)
        db_connection().commit()
        return members_count
        
    except Exception as ex:
        print ex
        db_session.rollback()

        
        





