
from adya.github import github_utils
from adya.common.db.models import DomainUser
from datetime import datetime
from adya.common.db.connection import db_connection
from adya.common.constants import constants, urls
from adya.common.utils.response_messages import Logger
import github

def query(auth_token, query_params, scanner):
    datasource_id = query_params["dataSourceId"]
    org_name = query_params["org_name"]
    github_client = github_utils.get_github_client(datasource_id)
    org = github_client.get_organization(org_name)
    members = []
    
    if org:
        for member in org.get_members():
            members.append(member.raw_data)

        #Creating a webhook for the organisation
        if not constants.DEPLOYMENT_ENV == "local":
            try:
                config = {
                    "url": urls.GITHUB_NOTIFICATIONS_URL,
                    "content_type": "json" 
                }
                events = ["membership","organization","org_block","team","team_add"]
                org.create_hook(name="web", config=config, events=events, active=True)
            except github.GithubException as ex:
                if ex.status == 422:
                    Logger().info("Webhook already exist for organization - {} with exception - {}".format(org_name, ex))
                else:
                    Logger().exception("Github Exception occurred while subscribing for push notification for organisation = {} with exception - {}".format(org_name, ex))
            except Exception as ex:
                Logger().exception("Exception occurred while subscribing for push notification for organisation = {} with exception - {}".format(org_name, ex))

    return {"payload": members}

def process(db_session, auth_token, query_params, scanner_data):
    datasource_id = query_params["dataSourceId"]
    domain_id = query_params["domainId"]
    members = scanner_data["entities"]
    processed_members_count = 0

    for member in members:
        member_info = DomainUser()
        member_info.datasource_id = datasource_id
        member_info.full_name = member["name"] if member["name"] else member["login"]
        name_split = member_info.full_name.split(" ")
        if len(name_split) > 1:
            member_info.first_name = name_split[0]
            member_info.last_name = name_split[1]
        else:
            member_info.first_name = name_split[0]
            member_info.last_name = ''
        member_info.email = member["email"] if member["email"] else github_utils.get_default_github_email(member["id"], member["login"])
        member_info.creation_time = datetime.strptime(member["created_at"], "%Y-%m-%dT%H:%M:%SZ")
        member_info.last_updated = datetime.strptime(member["updated_at"], "%Y-%m-%dT%H:%M:%SZ")
        member_info.photo_url = member["avatar_url"]
        member_info.user_id = member["id"]
        member_info.member_type = constants.EntityExposureType.INTERNAL.value

        if github_utils.is_external_user(domain_id, member_info.email):
            member_info.member_type = constants.EntityExposureType.EXTERNAL.value

        try:
            db_session.add(member_info)
            db_connection().commit()
            processed_members_count = processed_members_count + 1
        except Exception as ex:
            Logger().exception("Exception occurred while processing org member - {} with exception - {}".format(member, ex))
            db_session.rollback()
    
    return processed_members_count
        
def post_process(db_session, auth_token, query_params):
    pass