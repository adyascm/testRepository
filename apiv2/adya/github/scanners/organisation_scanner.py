
from adya.github import github_utils
from adya.common.db.models import DomainUser
from datetime import datetime
from adya.common.db.connection import db_connection
from adya.common.constants import constants

def query(auth_token, query_params, scanner):
    datasource_id = query_params["datasource_id"]
    org_name = query_params["org_name"]
    github_client = github_utils.get_github_client(datasource_id)
    org = github_client.get_organization(org_name)
    all_members = []
    members = []
    
    print "Scanning organization members"
    for member in org.get_members():
        if member not in all_members:
            print "organization member : {0}".format(member.name)
            all_members.append(member)
            members.append(member.raw_data)

    return {"payload": members}

def process(db_session, auth_token, query_params, scanner_data):
    datasource_id = query_params["datasource_id"]
    domain_id = query_params["domain_id"]
    members = scanner_data["entities"]
    all_members = []
    processed_members_count = 0

    for member in members:
        member_info = {}
        member_info["datasource_id"] = datasource_id
        member_info["full_name"] = member["name"] if member["name"] else member["login"]
        name_split = member_info["full_name"].split(" ")
        if len(name_split) > 1:
            member_info["first_name"] = name_split[0]
            member_info["last_name"] = name_split[1]
        else:
            member_info["first_name"] = name_split[0]
            member_info["last_name"] = ''
        user_email = "{0}+{1}@users.noreply.github.com".format(member["id"], member["login"])
        member_info["email"] = member["email"] if member["email"] else user_email
        creation_time = datetime.strptime(member["created_at"], "%Y-%m-%dT%H:%M:%SZ")
        updation_time = datetime.strptime(member["updated_at"], "%Y-%m-%dT%H:%M:%SZ")
        member_info["creation_time"] = creation_time
        member_info["last_updated"] = updation_time
        member_info["photo_url"] = member["avatar_url"]
        member_info["user_id"] = member["id"]
        member_info["member_type"] = constants.EntityExposureType.INTERNAL.value

        if github_utils.is_external_user(domain_id, member_info["email"]):
            member_info["member_type"] = constants.EntityExposureType.EXTERNAL.value

        all_members.append(member_info)
        processed_members_count = processed_members_count + 1

    try:
        #db_session.bulk_insert_mappings(DomainUser, all_members)
        db_session.execute(DomainUser.__table__.insert().prefix_with("IGNORE").values(all_members))
        db_connection().commit()
        return processed_members_count
    
    except Exception as ex:
        print ex
        db_session.rollback()