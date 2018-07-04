from datetime import datetime
import uuid
from sqlalchemy import and_

from adya.common.db.models import DomainUser, DataSource, DatasourceScanners

from adya.common.db.connection import db_connection

from adya.common.utils import messaging
from adya.slack.mappers import entities
from adya.common.constants import urls, constants
from adya.common.utils.response_messages import Logger
from adya.slack import slack_utils, slack_constants
from adya.slack.slack_utils import is_external_user

def query(auth_token, query_params, scanner):
    next_page_token = query_params["nextPageNumber"]
    slack_client = slack_utils.get_slack_client(scanner.datasource_id)
    user_list = slack_client.api_call(
        "users.list",
        limit=150,
        cursor=next_page_token
    )
    member_list = user_list['members']
    next_page_token = user_list['response_metadata']['next_cursor']
    return {"payload": member_list, "nextPageNumber": next_page_token}

def process(db_session, auth_token, query_params, scanner_data):
    domain_id = query_params["domainId"]
    datasource_id = query_params["dataSourceId"]

    members_data = scanner_data["entities"]
    users_count = 0
    try:
        for member in members_data:
            users_count = users_count + 1
            if not member['is_bot']:
                userObj = entities.SlackUser(domain_id, datasource_id, member)
                db_session.add(userObj.get_model())

        db_connection().commit()
        return users_count
    except Exception as ex:
        Logger().exception("Exception occurred while processing data for slack users ex: {}".format(ex))
        db_session.rollback()
        return 0
        
def post_process(db_session, auth_token, query_params):
    domain_id = query_params["domainId"]
    datasource_id = query_params["dataSourceId"]
    now = datetime.utcnow()
    internal_users = db_session.query(DomainUser).filter(and_(DomainUser.datasource_id == datasource_id, DomainUser.type == constants.DirectoryEntityType.USER.value, DomainUser.member_type == constants.EntityExposureType.INTERNAL.value)).all()
    for internal_user in internal_users:
        scanner = DatasourceScanners()
        scanner.datasource_id = datasource_id
        scanner.scanner_type = slack_constants.ScannerTypes.FILES.value
        scanner.channel_id = str(uuid.uuid4())
        scanner.user_email = internal_user.email
        scanner.started_at = now
        scanner.in_progress = 1
        db_session.add(scanner)
        db_connection().commit()
        file_query_params = {'domainId': domain_id, 'dataSourceId': datasource_id, 'scannerId': str(scanner.id), 
                    'userId': internal_user.user_id, 'userEmail': internal_user.email}
        messaging.trigger_get_event(urls.SCAN_SLACK_ENTITIES, auth_token, file_query_params, "slack")


