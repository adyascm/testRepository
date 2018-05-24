import requests
import datetime

from sqlalchemy import and_

from adya.common.constants import urls
from adya.common.constants.constants import permission_priority, Permission_Role_mapping, get_url_from_path
from adya.common.db.connection import db_connection
from adya.common.db.models import PushNotificationsSubscription, Resource, ResourcePermission
from adya.common.utils.response_messages import Logger
from adya.gsuite import gutils


def process_notifications_for_activity(notification_type, datasource_id, channel_id, body):
    if notification_type == "sync" or not body:
        return
    db_session = db_connection().get_session()

    subscription = db_session.query(PushNotificationsSubscription).filter(
        PushNotificationsSubscription.channel_id == channel_id).first()
    if not subscription:
        Logger().warn("Subscription does not exist for datasource_id: {} and channel_id: {}, hence ignoring the notification.".format(
            datasource_id, channel_id))
        return

    if subscription.in_progress == 1:
        if subscription.stale == 0:
            subscription.stale = 1
            db_connection().commit()
            Logger().warn("Subscription already in progress for datasource_id: {} and channel_id: {}, hence marking it stale and returning.".format(
                datasource_id, channel_id))
        else:
            Logger().warn("Subscription already in progress and marked stale for datasource_id:{} and channel_id: {}, hence directly returning.".format(
                datasource_id, channel_id))
        return

    user_email = subscription.user_email

    try:
        should_mark_in_progress = True
        while True:
            # Mark Inprogress
            if should_mark_in_progress:
                Logger().info("Marking the subscription to be in progress ")
                db_session.refresh(subscription)
                subscription.in_progress = 1
                subscription.last_accessed = datetime.datetime.utcnow()
                db_connection().commit()
                should_mark_in_progress = False

            # resource_list = []
            # permission_list = []

            resource = {}
            resource_permission = {}
            actor_data = body['actor']
            last_modifying_user_email = actor_data['email']
            last_modified_time = body['id']['time'][:-1]
            for event in body['events']:

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

                    # resource_permission["datasource_id"] = datasource_id
                    # permission_list.append(resource_permission)

                # resource["datasource_id"] = datasource_id
                # resource_list.append(resource)

            # db update ; considering there will be no bulk update
            # db_session.query(Resource).filter(and_(Resource.datasource_id == datasource_id, Resource.resource_id ==
            #                                        resource["resource_id"])).update({Resource.last_modifying_user_email:
            #                                  last_modifying_user_email, Resource.last_modified_time: last_modified_time,
            #                      Resource.resource_owner_id: resource['resource_owner_id']})

            # db_session.query(ResourcePermission).filter(and_(ResourcePermission.datasource_id == datasource_id,
            #                         ResourcePermission.resource_id == resource_permission["resource_id"],
            #                         ResourcePermission.email == resource_permission['email'])).\
            #                         update({
            #                         ResourcePermission.permission_type: resource_permission['permission_type'],
            #                         ResourcePermission.exposure_type: resource_permission['exposure_type']
            #                         })

            # bulk update
            # db_session.bulk_update_mappings(Resource, resource_list)
            # db_session.bulk_update_mappings(ResourcePermission, permission_list)
            break


        db_session.refresh(subscription)
        subscription.last_accessed = datetime.datetime.utcnow()
        subscription.in_progress = 0
        db_connection().commit()

        db_session.refresh(subscription)
        if subscription.stale == 1:
            subscription.stale = 0
            db_connection().commit()
            response = requests.post(get_url_from_path(urls.PROCESS_ACTIVITY_NOTIFICATIONS_PATH),
                                     headers={"X-Goog-Channel-Token": datasource_id,
                                              "X-Goog-Channel-ID": channel_id,
                                              'X-Goog-Resource-State': notification_type})

    except Exception as e:
        Logger().exception("Exception occurred while processing push notification for user: {}, datasource_id: {} channel_id: {} - {}".format(
            user_email, datasource_id, channel_id, e))

