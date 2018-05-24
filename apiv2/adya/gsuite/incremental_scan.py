import requests
import uuid
import datetime
from datetime import timedelta
import gutils
from sqlalchemy import and_

from adya.common.constants.constants import TypeOfPushNotificationCallback
from adya.common.utils.response_messages import Logger
from adya.common.db.connection import db_connection
from adya.common.db.models import PushNotificationsSubscription, Resource, ResourcePermission, DomainUser, \
    LoginUser, DataSource
from adya.common.constants import constants, urls
from adya.common.utils import aws_utils, messaging


def handle_channel_expiration():
    db_session = db_connection().get_session()
    subscription_list = db_session.query(PushNotificationsSubscription).all()
    for row in subscription_list:
        access_time = datetime.datetime.utcnow()

        #If the subscription is not yet expired and expiry is more than 6 hours, dont resubscribe
        #It will happen in the next 6 hourly check
        if row.expire_at > access_time and row.expire_at > (access_time + timedelta(seconds=21600)):
            continue

        #If the subscription is not yet expired and is going to expire in next 6 hours, then first unsubscribe
        if row.expire_at > access_time and row.expire_at < (access_time + timedelta(seconds=21600)):
            unsubscribe_subscription(row)

        #If subscription is in progress, then dont renew it in this cycle
        if row.in_progress:
            continue

        try:
            is_service_account_enabled = False
            if row.drive_root_id == "SVC":
                is_service_account_enabled = True

            body = {
                "id": row.channel_id,
                "type": "web_hook",
                "token": row.datasource_id,
                "payload": "true",
                "params": {"ttl": 86100}
            }

            if row.notification_type == TypeOfPushNotificationCallback.ACTIVITY_CHANGE:
                reports_service = gutils.get_gdrive_reports_service(
                    None, row.user_email, db_session)

                address = urls.PROCESS_ACTIVITY_NOTIFICATIONS_PATH
                body["address"] = constants.get_url_from_path(address)

                response = reports_service.activities().watch(
                    userKey='all', applicationName='drive', body=body).execute()

            else:
                if is_service_account_enabled:
                    drive_service = gutils.get_gdrive_service(None, row.user_email, db_session)
                else:
                    user = db_session.query(LoginUser).filter(
                        and_(LoginUser.domain_id == row.domain_id, LoginUser.email == row.user_email)).first()
                    drive_service = gutils.get_gdrive_service(user.auth_token, row.user_email, db_session)

                if row.page_token == '':
                    response = drive_service.changes().getStartPageToken().execute()
                    row.page_token = response.get('startPageToken')
                    Logger().info("new start token - {}".format(row.page_token))

                Logger().info("Trying to renew subscription for push notifications for domain_id: {} datasource_id: {} channel_id: {}".format(
                    row.domain_id, row.datasource_id, row.channel_id))

                address = urls.PROCESS_DRIVE_NOTIFICATIONS_PATH
                body["address"] = constants.get_url_from_path(address)

                response = drive_service.changes().watch(pageToken=row.page_token, restrictToMyDrive='true',
                                                     body=body).execute()

                Logger().info("Response for push notifications renew subscription request for domain_id: {} datasource_id: {} channel_id: {} - {}".format(
                    row.domain_id, row.datasource_id, row.channel_id, response))

            row.last_accessed = access_time
            row.expire_at = access_time + timedelta(seconds=86100)
            row.resource_id = response['resourceId']
            row.resource_uri = response['resourceUri']

        except Exception as e:
            Logger().exception("Exception occurred while trying to renew subscription for push notifications for domain_id: {} datasource_id: {} channel_id: {}".format(
                row.domain_id, row.datasource_id, row.channel_id))

    db_connection().commit()

    return "Subscription renewal completed"


def _subscribe_for_user(db_session, auth_token, datasource, email, is_local_deployment):
    channel_id = str(uuid.uuid4())
    access_time = datetime.datetime.utcnow()
    expire_time = access_time
    start_token = ''
    resource_id = ''
    resource_uri = ''
    notification_type = ''
    try:
        drive_service = gutils.get_gdrive_service(auth_token, email, db_session)
        body = {
            "id": channel_id,
            "type": "web_hook",
            "address": constants.get_url_from_path(urls.PROCESS_DRIVE_NOTIFICATIONS_PATH),
            "token": datasource.datasource_id,
            "payload": "true",
            "params": {"ttl": 86100}
        }

        response = drive_service.changes().getStartPageToken().execute()
        start_token = response.get('startPageToken')

        if not is_local_deployment:
            watch_response = drive_service.changes().watch(pageToken=start_token, restrictToMyDrive='true',
                                                        body=body).execute()
            Logger().info(" watch_response for a user :  {} ".format(watch_response))

            expire_time = access_time + timedelta(seconds=86100)
            resource_id = watch_response['resourceId']
            resource_uri = watch_response['resourceUri']
        notification_type = TypeOfPushNotificationCallback.DRIVE_CHANGE

    except Exception as ex:
        Logger().exception("Exception occurred while subscribing for push notifications for domain_id: {} datasource_id: {} channel_id: {} - {}".format(
            datasource.domain_id, datasource.datasource_id, channel_id, ex))

    add_push_notifications_subscription(db_session, datasource, channel_id, email, access_time, expire_time,
                                            resource_id, resource_uri, notification_type, start_token)


def _subscribe_for_drive_activity(db_session, login_user, datasource, admin_user_email):
    channel_id = str(uuid.uuid4())
    access_time = datetime.datetime.utcnow()

    reports_service = gutils.get_gdrive_reports_service(
        login_user.auth_token, admin_user_email, db_session)

    body = {
        "id": channel_id,
        "type": "web_hook",
        "address": constants.get_url_from_path(urls.PROCESS_ACTIVITY_NOTIFICATIONS_PATH),
        "token": datasource.datasource_id,
        "payload": "true",
        "params": {"ttl": 21600}
    }

    watch_response = reports_service.activities().watch(
        userKey='all', applicationName='drive', body=body).execute()

    Logger().info(" watch_response for all users :  {} ".format(watch_response))
    expire_time = access_time + timedelta(seconds=86100)
    resource_id = watch_response['resourceId']
    resource_uri = watch_response['resourceUri']
    notification_type = TypeOfPushNotificationCallback.ACTIVITY_CHANGE

    add_push_notifications_subscription(db_session, datasource, channel_id, admin_user_email, access_time, expire_time,
                                            resource_id, resource_uri, notification_type, None)


def subscribe(domain_id, datasource_id):

    is_local_deployment = constants.DEPLOYMENT_ENV == "local"

    if not is_local_deployment:
        # set up a resubscribe handler that runs every 6 hours cron(0 0/6 ? * * *)
        aws_utils.create_cloudwatch_event("handle_channel_expiration", "cron(0 0/6 ? * * *)",
                                            aws_utils.get_lambda_name("get",
                                                                    urls.HANDLE_GDRIVE_CHANNEL_EXPIRATION_PATH, "gsuite"))

        # since we dont always get notification for changes, adding an event which will run every hour and check for drive changes
        aws_utils.create_cloudwatch_event("gdrive_periodic_changes_poll", "cron(0 0/1 * * ? *)",
                                            aws_utils.get_lambda_name("get",
                                                                    urls.GDRIVE_PERIODIC_CHANGES_POLL, "gsuite"))

    db_session = db_connection().get_session()
    datasource = db_session.query(DataSource).filter(
        DataSource.datasource_id == datasource_id).first()
    db_session.query(PushNotificationsSubscription).filter(
        PushNotificationsSubscription.datasource_id == datasource_id).delete()
    datasource.is_push_notifications_enabled = False
    db_connection().commit()

    login_user = db_session.query(LoginUser).filter(
        LoginUser.domain_id == datasource.domain_id).first()

    if not is_local_deployment:
        #Try subscribing for activity notifications
        try:
            _subscribe_for_drive_activity(db_session, login_user, datasource, login_user.email)
        except:
            Logger().exception("Failed to subscribe for drive activity notifications")

    #Try subscribing for drive change notifications
    if datasource.is_serviceaccount_enabled:
        domain_users = db_session.query(DomainUser).filter(
            and_(DomainUser.datasource_id == datasource.datasource_id, DomainUser.member_type == 'INT')).all()
        for user in domain_users:
            _subscribe_for_user(db_session, login_user.auth_token, datasource, user.email, is_local_deployment)
    else:
        Logger().info("Service account is not enabled, subscribing for push notification using logged in user's creds")
        _subscribe_for_user(db_session, login_user.auth_token, datasource, login_user.email, is_local_deployment)

    datasource.is_push_notifications_enabled = True
    db_connection().commit()

def add_push_notifications_subscription(db_session, datasource, channel_id, user_email, access_time, expire_time,
                                        resource_id, resource_uri, notification_type, page_token):

    push_notifications_subscription = PushNotificationsSubscription()
    push_notifications_subscription.domain_id = datasource.domain_id
    push_notifications_subscription.datasource_id = datasource.datasource_id
    push_notifications_subscription.channel_id = channel_id
    push_notifications_subscription.drive_root_id = "SVC"
    push_notifications_subscription.page_token = page_token
    push_notifications_subscription.in_progress = 0
    push_notifications_subscription.stale = 0
    push_notifications_subscription.user_email = user_email
    push_notifications_subscription.last_accessed = access_time
    push_notifications_subscription.expire_at = expire_time
    push_notifications_subscription.resource_id = resource_id
    push_notifications_subscription.resource_uri = resource_uri
    push_notifications_subscription.notification_type = notification_type
    db_session.add(push_notifications_subscription)


def unsubscribe_subscription(subscription):
    try:
        if not subscription.resource_id:
            Logger().error("Subscription resource id is missing, hence ignoring unsubscription request...")
            return True

        notification_type = subscription.notification_type
        address = ''
        if notification_type == TypeOfPushNotificationCallback.DRIVE_CHANGE:
             drive_service = gutils.get_gdrive_service(None, subscription.user_email)
             address =  urls.PROCESS_DRIVE_NOTIFICATIONS_PATH
             body = {
                 "id": subscription.channel_id,
                 "type": "web_hook",
                 "address": constants.get_url_from_path(address),
                 "token": subscription.datasource_id,
                 "payload": "true",
                 "params": {"ttl": 86100},
                 "resourceId": subscription.resource_id,
                 "resourceUri": subscription.resource_uri
             }
             Logger().info("trying to unsubscribe the channel with body - {}".format(body))
             unsubscribe_response = drive_service.channels().stop(body=body).execute()
             Logger().info("google unsubscribe response for drive: {} ".format(unsubscribe_response))

        elif notification_type == TypeOfPushNotificationCallback.ACTIVITY_CHANGE:
            report_service = gutils.get_gdrive_reports_service(None, subscription.user_email)
            address = urls.PROCESS_ACTIVITY_NOTIFICATIONS_PATH
            body = {
                "id": subscription.channel_id,
                "resourceId": subscription.resource_id
            }

            Logger().info("trying to unsubscribe the channel with body - {}".format(body))
            unsubscribe_response = report_service.channels().stop(body=body).execute()
            Logger().info("google unsubscribe response for activity : {} ".format(unsubscribe_response))

        return True

    except Exception as ex:
        Logger().exception("Exception occurred while unsubscribing for push notifications for - {}".format(ex))
        return False


def gdrive_periodic_changes_poll(datasource_id=None):
    db_session = db_connection().get_session()
    hour_back = datetime.datetime.utcnow()+timedelta(hours=-1, minutes=-5)
    subscription_list = db_session.query(PushNotificationsSubscription)
    if datasource_id:
        subscription_list = subscription_list.filter(PushNotificationsSubscription.datasource_id == datasource_id)
    else:
        subscription_list = subscription_list.filter(PushNotificationsSubscription.last_accessed < hour_back)
    for row in subscription_list.all():
        Logger().info("Requesting refresh of gdrive data for user: {}".format(row.user_email))
        if row.notification_type == constants.TypeOfPushNotificationCallback.ACTIVITY_CHANGE:
            requests.post(constants.get_url_from_path(urls.PROCESS_ACTIVITY_NOTIFICATIONS_PATH),
                          headers={"X-Goog-Channel-Token": row.datasource_id,
                                   "X-Goog-Channel-ID": row.channel_id,
                                   'X-Goog-Resource-State': "change"})

        elif row.notification_type == constants.TypeOfPushNotificationCallback.DRIVE_CHANGE:
            requests.post(constants.get_url_from_path(urls.PROCESS_DRIVE_NOTIFICATIONS_PATH),
                          headers={"X-Goog-Channel-Token": row.datasource_id,
                                                  "X-Goog-Channel-ID": row.channel_id,
                                                  'X-Goog-Resource-State': "change"})
    return


def unsubscribed_all_the_previous_subscription(datasource_id):
    db_session = db_connection().get_session()
    subscriptions = db_session.query(PushNotificationsSubscription).filter(PushNotificationsSubscription.datasource_id ==
                                                                          datasource_id).all()

    for subscription in subscriptions:
        Logger().info("unsubscribed_all_the_previous_subscription : subscription")
        unsubscribe_subscription(subscription)

    Logger().info("unsubscribed all the channel for datasource - {} ".format(datasource_id))