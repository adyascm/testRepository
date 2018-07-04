from sqlalchemy import and_

from adya.gsuite import gutils
from datetime import datetime, timedelta

from adya.common.constants import constants
from adya.common.db import db_utils
from adya.common.db.connection import db_connection
from adya.common.utils.response_messages import Logger
from adya.common.db.models import DataSource, DomainUser

def get_activities_for_user(auth_token, user_email, start_time=None):
    if not auth_token:
        Logger().info("get_activities_for_user : auth_token is not present")
        return None

    db_session = db_connection().get_session()
    login_user = db_utils.get_user_session(auth_token, db_session)
    admin_user = login_user
    if not login_user.is_admin:
        datasource = db_session.query(DataSource).filter(and_(DataSource.domain_id == admin_user.domain_id, DataSource.datasource_type == constants.ConnectorTypes.GSUITE)).first()
        admin_user = db_session.query(DomainUser).filter(and_(DomainUser.is_admin == True, DomainUser.datasource_id == datasource.datasource_id)).first()

    results = []
    if auth_token and auth_token == constants.INTERNAL_SECRET:
        reports_service = gutils.get_gdrive_reports_service(None, admin_user.email)
        if not start_time:
            start_time = datetime.today() - timedelta(days=7)

        start_time_string = start_time.isoformat("T") + "Z"

        results = reports_service.activities().list(userKey=user_email, applicationName='drive', maxResults=50,
                                                    startTime=start_time_string).execute()

    else:
        if not login_user.is_admin and login_user.is_serviceaccount_enabled and login_user.email != user_email:
            return None

        reports_service = gutils.get_gdrive_reports_service(auth_token, admin_user.email)
        results = reports_service.activities().list(userKey=user_email, applicationName='drive', maxResults=50).execute()

    payload = process_user_activity(user_email, results)
    return payload



def process_user_activity(user_email, activities):
    Logger().info("got activities: " + str(activities))
    processed_activities = []
    if 'items' in activities:
        activity_log_list = activities['items']
        Logger().info("PROCESS ACTIVITY USER LOG : Drive Returned "+ str(len(activity_log_list)) + " Activity Details ")

        for activity in activity_log_list:
            activity_events = activity['events']

            ip_address = "unknown"
            if "ipAddress" in activity:
                ip_address = activity['ipAddress']

            activity_timestamp = activity['id']['time']
            for event in activity_events:
                event_name = event['name']
                activity_events_parameters = event['parameters']
                primary_name = activity_events_parameters[0]['name']
                if primary_name == 'primary_event':
                    boolValue = activity_events_parameters[0]['boolValue']
                    if boolValue:
                        resource_name = None
                        resource_type = None

                        for entries in activity_events_parameters:
                            if entries['name'] == 'doc_title':
                                resource_name = entries['value']
                            elif entries['name'] == 'doc_type':
                                resource_type = entries['value']

                        if resource_name is not None and resource_type is not None:
                            processed_activities.append(
                                [activity_timestamp, event_name, resource_name, resource_type,
                                    ip_address])

    return processed_activities
