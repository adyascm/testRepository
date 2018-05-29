import requests
import datetime

from sqlalchemy import and_

from adya.common.constants import urls, constants
from adya.common.db.connection import db_connection
from adya.common.db.models import PushNotificationsSubscription, Resource, ResourcePermission, Application, ApplicationUserAssociation
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

        if app_name == "token":
            process_token_activity(datasource_id, actor_email, incoming_activity)
        # elif app_name == "drive":
        #     process_drive_activity(actor_email, incoming_activity)
        

        db_session.refresh(subscription)
        subscription.last_accessed = datetime.datetime.utcnow()
        subscription.page_token = datetime.datetime.utcnow().isoformat("T") + "Z"
        db_connection().commit()


    except Exception as e:
        Logger().exception("Exception occurred while processing activity notification for datasource_id: {} channel_id: {} - {}".format(datasource_id, channel_id, e))

def process_token_activity(datasource_id, actor_email, incoming_activity):
    Logger().info("Processing token activity - {}".format(incoming_activity))
    for event in incoming_activity['events']:
        event_name = event['name']
        if event_name == "authorize":
            application = Application()
            application.datasource_id = datasource_id
            user_association = ApplicationUserAssociation()
            user_association.user_email = actor_email
            user_association.datasource_id = datasource_id
            event_parameters = event['parameters']
            for param in event_parameters:
                param_name = param["name"]
                param_value = None
                if param_name == "client_id":
                    application.client_id = param["value"]
                    user_association.client_id = application.client_id
                elif param_name == "app_name":
                    application.display_text = param["value"]
                elif param_name == "scope":
                    scopes = param["multiValue"]
                    application.score = gutils.get_app_score(scopes)
                    application.scopes = ','.join(scopes)

            db_session = db_connection().get_session()
            db_session.add(application)
            db_session.add(user_association)
            db_connection().commit()

            #Trigger the policy validation now
            payload = {}
            payload["application"] = json.dumps(application, cls=alchemy_encoder())
            policy_params = {'dataSourceId': datasource_id, 'policy_trigger': constants.PolicyTriggerType.APP_INSTALL}
            messaging.trigger_post_event(urls.GSUITE_POLICIES_VALIDATE_PATH, "Internal-Secret", policy_params, payload, "gsuite")



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
                                curr_perm_value = constants.permission_priority[perm] if perm in constants.permission_priority else 0
                                max_perm_Value = constants.permission_priority[max_perm_string] if max_perm_string in constants.permission_priority else 0
                                max_perm_string = perm if curr_perm_value > max_perm_Value else max_perm_string

                            resource_permission['permission_type'] = constants.Permission_Role_mapping[max_perm_string]
                        elif parameter['name'] == 'visibility':
                            resource_permission['exposure_type'] = parameter['value']
