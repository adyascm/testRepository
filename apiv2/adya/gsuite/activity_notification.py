import requests
import datetime

from sqlalchemy import and_

from adya.common.constants import urls
from adya.common.constants.constants import permission_priority, Permission_Role_mapping, get_url_from_path
from adya.common.db.connection import db_connection
from adya.common.db.models import PushNotificationsSubscription, Resource, ResourcePermission
from adya.common.utils.response_messages import Logger
from adya.gsuite import gutils


def process_notifications(notification_type, datasource_id, channel_id, body):
    if notification_type == "sync":
        return

    db_session = db_connection().get_session()

    subscription = db_session.query(PushNotificationsSubscription).filter(
        PushNotificationsSubscription.channel_id == channel_id).first()
    if not subscription:
        Logger().warn("Subscription does not exist for datasource_id: {} and channel_id: {}, hence ignoring the notification.".format(
            datasource_id, channel_id))
        return

    incoming_activity = body

    #If notification type is adya, then that means its triggered manually
    #So we need to fetch the last event first to simulate trigger
    if notification_type == "adya":
        reports_service = gutils.get_gdrive_reports_service(None, subscription.user_email, db_session)
        results = reports_service.activities().list(userKey="all", applicationName=subscription.notification_type, maxResults=1).execute()
        if results and "items" in results:
            incoming_activity = results["items"][0]
        else:
            return

    try:
        app_name = incoming_activity["id"]["applicationName"]
        actor_email = incoming_activity['actor']['email']
        if app_name == "drive":
            process_drive_activity(actor_email, incoming_activity)

        db_session.refresh(subscription)
        subscription.last_accessed = datetime.datetime.utcnow()
        subscription.page_token = datetime.datetime.utcnow().isoformat("T") + "Z"
        db_connection().commit()


    except Exception as e:
        Logger().exception("Exception occurred while processing activity notification for datasource_id: {} channel_id: {} - {}".format(datasource_id, channel_id, e))

def process_drive_activity(actor_email, incoming_activity):
    resource = {}
    resource_permission = {}
    last_modifying_user_email = actor_email
    last_modified_time = incoming_activity['id']['time'][:-1]
    for event in incoming_activity['events']:

        event_name = event['name']
        event_type = event['type']

        if event_type == 'acl_change':
            activity_events_parameters = event['parameters']
            primary_name = activity_events_parameters[0]['name']
            if primary_name == 'primary_event':
                boolValue = activity_events_parameters[0]['boolValue']
                if boolValue:
                    max_perm_string = None
                    for parameter in activity_events_parameters:
                        if parameter['name'] == 'doc_id':
                            resource["resource_id"] = parameter['value']
                            resource_permission["resource_id"] =parameter['value']
                        elif parameter['name'] == 'owner':
                            resource['resource_owner_id'] = parameter['value']
                        # permission change activity
                        elif parameter['name'] == 'target_user':
                            resource_permission['email'] = parameter['value']
                        elif parameter['name'] == 'new_value':
                            perm_values = parameter['multiValue'] #['can_edit','can_view']
                            for perm in perm_values:
                                curr_perm_value = permission_priority[perm] if perm in permission_priority else 0
                                max_perm_Value = permission_priority[max_perm_string] if max_perm_string in permission_priority else 0
                                max_perm_string = perm if curr_perm_value > max_perm_Value else max_perm_string

                            resource_permission['permission_type'] = Permission_Role_mapping[max_perm_string]
                        elif parameter['name'] == 'visibility':
                            resource_permission['exposure_type'] = parameter['value']
