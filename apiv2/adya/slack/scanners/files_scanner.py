from adya.common.db.connection import db_connection

from adya.common.utils.response_messages import Logger
from adya.slack import slack_utils
from adya.slack.mappers import entities


def query(auth_token, query_params, scanner):
    next_page_token = query_params["nextPageNumber"]
    user_id = query_params["userId"]
    if not next_page_token:
        next_page_token = 1
    slack_client = slack_utils.get_slack_client(scanner.datasource_id)
    file_list = slack_client.api_call("files.list",
                                      user=user_id,
                                      page=next_page_token)

    files = file_list['files']
    next_page_token = file_list['paging']['page'] + 1
    total_number_of_page = file_list['paging']['pages']
    if next_page_token > total_number_of_page:
        next_page_token = ""

    return {"payload": files, "nextPageNumber": next_page_token}


def process(db_session, auth_token, query_params, scanner_data):
    user_email = query_params["userEmail"]
    datasource_id = query_params["dataSourceId"]
    db_session = db_connection().get_session()
    try:
        resource_count = 0
        file_list = scanner_data["entities"]
        for file in file_list:
            resource_count = resource_count + 1
            file['resource_owner_email'] = user_email
            file_obj = entities.SlackFile(datasource_id, file)
            db_session.add(file_obj.get_model())

        db_connection().commit()
        return resource_count

    except Exception as ex:
        Logger().exception("Exception occurred while processing data for slack files using ex : {}".format(ex))
        db_session.rollback()
        return 0


def post_process(db_session, auth_token, query_params):
    pass
