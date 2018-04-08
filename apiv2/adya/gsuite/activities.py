from adya.datasources.google import gutils
from adya.db.models import DataSource
from adya.db.connection import db_connection
from sqlalchemy import and_
from datetime import datetime, timedelta
from adya.controllers import domain_controller


def get_activities_for_user(auth_token, user_email, start_time=None):

    reports_service = gutils.get_gdrive_reports_service(auth_token, user_email)
    if not start_time:
        start_time = datetime.today() - timedelta(days=7)

    start_time_string = start_time.isoformat("T") + "Z"

    results = reports_service.activities().list(userKey=user_email, applicationName='drive', maxResults=100,
                                                startTime=start_time_string).execute()
    payload = process_user_activity(user_email, results)
    return payload


def process_user_activity(user_email, activities):
    print "got activities: ", activities
    processed_activities = []
    if 'items' in activities:
        activity_log_list = activities['items']
        print("PROCESS ACTIVITY USER LOG : Drive Returned ", len(activity_log_list), " Activity Details ")

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

                                # resource_id = entries['value']
                                resource_name = entries[
                                    'value']  # db_session.query(Resource).filter(and_(Resource.domain_id == domain_id,
                                # Resource.resource_id == resource_id)).first().resource_name
                            elif entries['name'] == 'doc_type':
                                resource_type = entries['value']

                        if resource_name is not None and resource_type is not None:
                            processed_activities.append(
                                [activity_timestamp, event_name, resource_name, resource_type,
                                    ip_address])

    return processed_activities
