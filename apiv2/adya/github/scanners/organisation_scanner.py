

from adya.github import github_utils, github_constants
from adya.common.db.models import DatasourceScanners, Resource, ResourcePermission, DomainUser, DatasourceCredentials
from adya.common.db.connection import db_connection
from adya.common.utils import messaging
from adya.common.utils.response_messages import Logger
from adya.common.constants import urls, constants
import uuid
import datetime
import json
import time

def query(auth_token, query_params, scanner):
    github_client = github_utils.get_github_client(scanner.datasource_id)
    authenticated_user = github_client.get_user()
    all_orgs = []  
    #Fetching the organisations under the authenticated_user
    for org in authenticated_user.get_orgs():
        all_orgs.append(org.raw_data)

    return {"payload": all_orgs, "nextPageNumber": None}

def process(db_session, auth_token, query_params, scanner_data):
    datasource_id = query_params["dataSourceId"]
    domain_id = query_params["domainId"]
    all_orgs = scanner_data["entities"]
    new_orgs_list = []
    processed_org_count = 0
    for org in all_orgs:
        org_info = {}
        org_info["datasource_id"] = datasource_id
        org_info["full_name"] = org['name']
        name_split = org_info["full_name"].split(" ")
        if len(name_split) > 1:
            org_info["first_name"] = name_split[0]
            org_info["last_name"] = name_split[1]
        else:
            org_info["first_name"] = name_split[0]
            org_info["last_name"] = ''
        org_info["email"] = org["email"] if org["email"] else github_utils.get_default_github_email(org["id"], org["login"])
        org_info["description"] = org["description"]
        org_info["type"] = constants.DirectoryEntityType.ORGANIZATION.value
        org_info["creation_time"] = datetime.datetime.strptime(org["created_at"], "%Y-%m-%dT%H:%M:%SZ")
        org_info["last_updated"] = datetime.datetime.strptime(org["updated_at"], "%Y-%m-%dT%H:%M:%SZ")
        org_info["user_id"] = org["id"]
        org_info["member_type"] = constants.EntityExposureType.INTERNAL.value

        new_orgs_list.append(org_info)
        processed_org_count = processed_org_count + 1
    
    try:
        if len(all_orgs) > 0:
            db_session.bulk_insert_mappings(DomainUser, new_orgs_list)
            db_connection().commit()

            for org in all_orgs:
                #Starting a scanner for each organization
                scanner = DatasourceScanners()
                scanner.datasource_id = datasource_id
                scanner.scanner_type = github_constants.ScannerTypes.ORG_MEMBERS.value
                scanner.channel_id = str(uuid.uuid4())
                scanner.user_email = org_info["email"]
                scanner.started_at = datetime.datetime.utcnow()
                scanner.in_progress = 1
                db_session.add(scanner)
                db_connection().commit()
                query_params = {"dataSourceId": datasource_id, "domainId": domain_id, "org_name": org["login"], "scannerId": scanner.id}
                messaging.trigger_get_event(urls.GITHUB_SCAN_ENTITIES, auth_token, query_params, "github")

    except Exception as ex:
        Logger().exception("Exception occurred while processing orgs with exception - {}".format(ex))
        db_session.rollback()
    
    return processed_org_count

def post_process(db_session, auth_token, query_params):
    pass