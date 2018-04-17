import requests
import uuid
import datetime
import dateutil.parser
from datetime import timedelta
import json
import gutils
from sqlalchemy import and_

from adya.common.utils.response_messages import Logger
from adya.common.db.connection import db_connection
from adya.common.db.models import PushNotificationsSubscription, Resource, ResourcePermission, DomainUser, \
    LoginUser, DataSource, PushNotificationsSubscriptionForUserlist
from adya.common.constants import constants, urls
from adya.common.utils import aws_utils
import incremental_scan

def _subscribe_for_activity(db_session, auth_token, datasource, user_email, domain_users):
    channel_id = str(uuid.uuid4())
    access_time = datetime.datetime.utcnow()
    expire_time = access_time
    resource_id = ''
    resource_uri = ''
    try:
        reports_service = gutils.get_gdrive_reports_service(
            auth_token, user_email, db_session)
        body = {
            "id": channel_id,
            "type": "web_hook",
            "address": constants.get_url_from_path(urls.PROCESS_GDRIVE_ACTIVITY_NOTIFICATIONS_PATH),
            "token": datasource.datasource_id,
            "payload": "true",
            "params": {"ttl": 86100}
        }
        watch_response = reports_service.activities().watch(
            userKey='all', applicationName='drive', body=body).execute()
        if watch_response['error]:
            for user in domain_users:
                incremental_scan._subscribe_for_user(
                    db_session, auth_token, datasource, user.email)
                Logger().info("Redirecting all users to subscribe for push notifications using drive api, for datasource_id: {}".format(datasource.datasource_id))
            return

        Logger().info(" watch_response for all users :  {} ".format(watch_response))
        expire_time = access_time + timedelta(seconds=86100)
        resource_id = watch_response['resourceId']
        resource_uri = watch_response['resourceUri']
    except Exception as ex:
        Logger().exception("Exception occurred while subscribing for push notifications for domain_id: {} datasource_id: {} channel_id: {} -".format(
            datasource.domain_id, datasource.datasource_id, channel_id))

    push_notifications_subscription = PushNotificationsSubscription()
    push_notifications_subscription.domain_id = datasource.domain_id
    push_notifications_subscription.datasource_id = datasource.datasource_id
    push_notifications_subscription.channel_id = channel_id
    push_notifications_subscription.drive_root_id = "SVC"
    push_notifications_subscription.page_token = ''
    push_notifications_subscription.in_progress = 0
    push_notifications_subscription.stale = 0
    push_notifications_subscription.user_email = user_email
    push_notifications_subscription.last_accessed = access_time
    push_notifications_subscription.expire_at = expire_time
    push_notifications_subscription.resource_id = resource_id
    push_notifications_subscription.resource_uri = resource_uri
    db_session.add(push_notifications_subscription)


def process_notifications(notification_type, datasource_id, channel_id):
    if notification_type == "sync":
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
        reports_service = gutils.get_gdrive_reports_service(
            None, user_email, db_session)
        drive_service = gutils.get_gdrive_service(None, user_email, db_session)
        should_mark_in_progress = True
        page_token = subscription.page_token  # it will be ''

        while True:
            if not page_token:
                response = reports_service.activities().list(
                    userKey='all', applicationName='drive').execute()
            else:
                response = reports_service.activities().list(
                    userKey='all', applicationName='drive', pageToken=page_token).execute()
            Logger().info("Processing following change notification for all users, changes - {}".format(response))
            items = response['items']

            if len(items) < 1:
                Logger().info("No changes found for this notification, hence ignoring.")
                return

            # Mark Inprogress
            if should_mark_in_progress:
                Logger().info("Marking the subscription to be in progress ")
                db_session.refresh(subscription)
                subscription.in_progress = 1
                subscription.last_accessed = datetime.datetime.utcnow()
                db_connection().commit()
                should_mark_in_progress = False

            for item in items:
                # Process change
                for evt in item['events']:
                    for param in evt['parameters']:
                        if(param['name'] == 'doc_id'):
                            fileId = param['value']
                            incremental_scan.handle_change(
                                drive_service, datasource_id, user_email, fileId)

            if 'nextPageToken' in response:
                # More changes available, so continue fetching changes with the updated page token
                page_token = response['nextPageToken']
            else:
                # last page, so no nextPageToken
                page_token = ''
                break

        db_session.refresh(subscription)
        if page_token != subscription.page_token:
            subscription.page_token = page_token
        subscription.last_accessed = datetime.datetime.utcnow()
        subscription.in_progress = 0
        db_connection().commit()

        db_session.refresh(subscription)
        if subscription.stale == 1:
            subscription.stale = 0
            db_connection().commit()
            response = requests.post(constants.get_url_from_path(urls.PROCESS_GDRIVE_ACTIVITY_NOTIFICATIONS_PATH),
                                     headers={"X-Goog-Channel-Token": datasource_id,
                                              "X-Goog-Channel-ID": channel_id,
                                              'X-Goog-Resource-State': notification_type})

    except Exception as e:
        Logger().exception("Exception occurred while processing push notification for user: {}, datasource_id: {} channel_id: {} - {}".format(
            user_email, datasource_id, channel_id, e))


def subscribe(domain_id, datasource_id):
    db_session = db_connection().get_session()
    try:
        # set up a resubscribe handler that runs every midnight cron(0 0 ? * * *)
        aws_utils.create_cloudwatch_event("handle_channel_expiration", "cron(0 0 ? * * *)",
                                          aws_utils.get_lambda_name("get",
                                                                    urls.HANDLE_GDRIVE_CHANNEL_EXPIRATION_PATH, "gsuite"))

        # since we dont always get notification for changes, adding an event which will run every hour and check for drive changes
        aws_utils.create_cloudwatch_event("gdrive_periodic_changes_poll", "cron(0/60 0 * * ? *)",
                                          aws_utils.get_lambda_name("get",
                                                                    urls.GDRIVE_PERIODIC_CHANGES_POLL, "gsuite"))
        datasource = db_session.query(DataSource).filter(
            DataSource.datasource_id == datasource_id).first()
        db_session.query(PushNotificationsSubscription).filter(
            PushNotificationsSubscription.datasource_id == datasource_id).delete()
        datasource.is_push_notifications_enabled = False
        db_connection().commit()

        login_user = db_session.query(LoginUser).filter(
            LoginUser.domain_id == datasource.domain_id).first()

        if datasource.is_serviceaccount_enabled:
            domain_users = db_session.query(DomainUser).filter(
                and_(DomainUser.datasource_id == datasource.datasource_id, DomainUser.member_type == 'INT')).all()
            admin_user_email = None
            for user in domain_users:
                if user.is_admin:
                    admin_user_email = user.email
            Logger().info("Got all users to subscribe for push notifications for datasource_id: {}".format(
                datasource.datasource_id))
            _subscribe_for_activity(
                db_session, login_user.auth_token, datasource, admin_user_email, domain_users)
        else:
            Logger().info("Service account is not enabled, subscribing for push notification using logged in user's creds")
            incremental_scan._subscribe_for_user(
                db_session, login_user.auth_token, datasource, login_user.email)

        datasource.is_push_notifications_enabled = True
        db_connection().commit()
    except Exception:
        Logger().exception("Exception occurred while requesting push notifications subscription for domain_id: {} datasource_id: {} -".format(
            domain_id, datasource_id))
