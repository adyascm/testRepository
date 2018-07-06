import json
from datetime import datetime

from sqlalchemy import and_, outerjoin

from adya.common.db.models import DomainUser, Resource, ResourcePermission, DataSource, alchemy_encoder, \
    Application, ApplicationUserAssociation, DirectoryStructure, DatasourceCredentials, AppInventory

from adya.common.db.connection import db_connection

from adya.common.utils import messaging

from adya.common.constants import urls, constants
from adya.common.utils.response_messages import Logger
from adya.slack import slack_utils, slack_constants
from adya.slack.mappers import entities

def query(auth_token, query_params, scanner):
    next_page_token = query_params["nextPageNumber"]
    change_type = query_params["change_type"]
    if not next_page_token:
        next_page_token = 1
    slack_client = slack_utils.get_slack_client(scanner.datasource_id)
    apps = slack_client.api_call("team.integrationLogs",
                                     limit=150,
                                     page=next_page_token,
                                     change_type=slack_constants.AppChangedTypes.REMOVED.value if (
                                         change_type == slack_constants.AppChangedTypes.REMOVED.value)
                                     else slack_constants.AppChangedTypes.ADDED.value
                                     )

    apps_list = apps["logs"]
    next_page_token = apps['paging']['page'] + 1
    total_number_of_page = apps['paging']['pages']
    if next_page_token > total_number_of_page:
        next_page_token = ""

    return {"payload": apps_list, "nextPageNumber": next_page_token}

def process(db_session, auth_token, query_params, scanner_data):
    datasource_id = query_params["dataSourceId"]
    db_session = db_connection().get_session()
    try:
        apps_count = 0
        apps_list = scanner_data["entities"]
        domain_id = db_session.query(DataSource).filter(DataSource.datasource_id == datasource_id).first().domain_id
        added_apps_map_by_id = {}
        added_app_associations = []
        for app in apps_list:
            apps_count = apps_count + 1
            change_type = app["change_type"]
            app_name = app["app_type"] if "app_type" in app else app["service_type"]
            app_id = app["app_id"] if "app_id" in app else app["service_id"]
            user_id = app["user_id"]
            if change_type == slack_constants.AppChangedTypes.ADDED.value:
                application = db_session.query(Application).filter(and_(Application.domain_id == domain_id, Application.display_text == app_name)).first()

                added_apps_map_by_id[app_name] = application
                if application:
                    if added_apps_map_by_id[app_name].unit_num:
                        added_apps_map_by_id[app_name].unit_num = added_apps_map_by_id[app_name].unit_num + 1
                    else:
                        added_apps_map_by_id[app_name].unit_num = 1
                else:
                    application_obj = entities.SlackApplication(db_session, domain_id, datasource_id, app)
                    application = application_obj.get_model()
                    db_session.add(application)
                    db_connection().commit()


                user_app_obj = {}
                user_app_obj["client_id"] = app_id
                user_app_obj["datasource_id"] = datasource_id
                user_app_obj["user_email"] = user_id
                user_app_obj["application_id"] = application.id
                added_app_associations.append(user_app_obj)
                db_session.execute(ApplicationUserAssociation.__table__.insert().prefix_with("IGNORE").values(user_app_obj))
                    

            elif change_type == slack_constants.AppChangedTypes.REMOVED.value:
                app_association = db_session.query(ApplicationUserAssociation).filter(and_(ApplicationUserAssociation.datasource_id == datasource_id, ApplicationUserAssociation.client_id == app_id, ApplicationUserAssociation.user_email == user_id)).first()
                if app_association:
                    app = db_session.query(Application).filter(and_(Application.id == app_association.application_id, Application.domain_id == domain_id)).update({Application.unit_num: Application.unit_num-1})
                    # if app:
                    #     db_session.delete(app)
                    db_session.delete(app_association)
        db_connection().commit()
        return apps_count           

    except Exception as ex:
        Logger().exception("Exception occurred while processing data for slack apps using ex : {}".format(ex))
        db_session.rollback()
        return 0
        
def post_process(db_session, auth_token, query_params):
    if query_params["change_type"] != slack_constants.AppChangedTypes.REMOVED.value:
        query_params["change_type"] = slack_constants.AppChangedTypes.REMOVED.value
        messaging.trigger_get_event(urls.SCAN_SLACK_ENTITIES, auth_token, query_params, "slack")
