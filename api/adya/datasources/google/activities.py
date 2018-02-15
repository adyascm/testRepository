from adya.datasources.google import gutils
from adya.common import constants
from adya.db.models import Resource, DataSource
from adya.db.connection import db_connection
from sqlalchemy import and_
from datetime import datetime, timedelta


def get_activities_for_user(domain_id, datasource_id, user_email):
    try:
        reports_service = gutils.get_gdrive_reports_service(domain_id=domain_id)

        if reports_service:
            print "Got reports service!"


        db_session = db_connection().get_session()
        datasource_name = db_session.query(DataSource).filter(and_(DataSource.domain_id == domain_id,
                                                               DataSource.datasource_id == datasource_id)).first().display_name

        start_time = datetime.today() - timedelta(days=7)
        start_time_string = start_time.isoformat("T") + "Z"

        results = reports_service.activities().list(userKey=user_email, applicationName='drive',
                                                startTime=start_time_string).execute()
        payload = process_user_activity(domain_id, datasource_name, user_email, results)
        while results.get('nextPageToken') is not None:
            reports_page_token = results.get('nextPageToken')
            results = reports_service.activities().list(userKey=user_email, applicationName='drive',
                                    startTime=start_time_string, page_token=reports_page_token).execute()
            payload += process_user_activity(domain_id, datasource_name, user_email, results)

        return payload

    except Exception as e:
        print e
        print "Exception occurred while fetching activity log for user: ", user_email, " on domain: ", domain_id


def process_user_activity(domain_id, datasource_name, user_email, activities):
    try:
        db_session = db_connection().get_session()
        print "got activities: ", activities
        processed_activities = []
        if activities.get('items'):
            activity_log_list = activities['items']
            print("PROCESS ACTIVITY USER LOG : Drive Returned ", len(activity_log_list), " Activity Details ")

            for activity in activity_log_list:
                activity_events = activity['events']
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
                                    #resource_id = entries['value']
                                    resource_name = entries['value']#db_session.query(Resource).filter(and_(Resource.domain_id == domain_id,
                                                     #           Resource.resource_id == resource_id)).first().resource_name
                                elif entries['name'] == 'doc_type':
                                    resource_type = entries['value']

                            if resource_name is not None and resource_type is not None:
                                processed_activities.append([activity_timestamp, event_name, datasource_name, resource_name, resource_type, ip_address])

        print processed_activities
        return processed_activities

    except Exception as e:
        print e
        print "Exception occurred while processing activity log for user: ", user_email, " on domain: ", domain_id
