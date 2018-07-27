import datetime

from sqlalchemy import and_

from adya.common.constants import urls, constants
from adya.common.db.connection import db_connection
from adya.common.db.models import DomainUser
from adya.common.utils import messaging
from adya.slack.slack_utils import get_slack_client


def get_accesslogs(datasource_id, page_num=1):
    db_session = db_connection().get_session()
    slack_client = get_slack_client(datasource_id)
    login_user_list = slack_client.api_call(
        "team.accessLogs",
        count=100,
        page=page_num
    )

    is_login_user_list = True if login_user_list['ok'] == True else False
    if is_login_user_list:
        current_page = login_user_list['page']
        total_pages = login_user_list['paging']['pages']
        logins = login_user_list['logins']
        for user in logins:
            last_login = datetime.datetime.fromtimestamp(user['date_last'])
            user_id = user['user_id']
            db_session.query(DomainUser).filter(
                and_(DomainUser.datasource_id == datasource_id, DomainUser.user_id == user_id)). \
                update({DomainUser.last_login_time: last_login})
        db_connection().commit()

        if current_page != total_pages:
            query_param = {'datasource_id': datasource_id, 'page_num': current_page+1}
            messaging.trigger_get_event(urls.SLACK_ACCESSLOGS, constants.INTERNAL_SECRET, query_param)
            return constants.ACCEPTED_STATUS_CODE

    return constants.SUCCESS_STATUS_CODE