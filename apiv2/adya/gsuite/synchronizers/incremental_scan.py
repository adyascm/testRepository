import requests
import uuid
import datetime
from datetime import timedelta
from adya.gsuite import gutils
from sqlalchemy import and_

from adya.common.utils.response_messages import Logger
from adya.common.db.connection import db_connection
from adya.common.db.models import PushNotificationsSubscription, DomainUser, LoginUser, DataSource
from adya.common.constants import constants, urls
from adya.common.utils import aws_utils, messaging


def handle_channel_expiration(page_num=0):
    page_num = page_num if page_num else 0
    db_session = db_connection().get_session()
    subscription_list = db_session.query(PushNotificationsSubscription).offset(page_num*50).limit(50).all()
    for row in subscription_list:
        access_time = datetime.datetime.utcnow()

        #If the subscription is not yet expired and expiry is more than 6 hours, dont resubscribe
        #It will happen in the next 6 hourly check
        if row.expire_at and row.expire_at > access_time and row.expire_at > (access_time + timedelta(seconds=21600)):
            continue

        #If the subscription is not yet expired and is going to expire in next 6 hours, then first unsubscribe
        # if row.expire_at and row.expire_at > access_time and row.expire_at < (access_time + timedelta(seconds=21600)):
        #     unsubscribe_subscription(row)

        #If subscription is in progress, then dont renew it in this cycle
        if row.in_progress:
            continue

        if row.notification_type == constants.GSuiteNotificationType.DRIVE_CHANGE.value:
            auth_token = None
            if not row.drive_root_id == "SVC":
                user = db_session.query(LoginUser).filter(
                    and_(LoginUser.domain_id == row.domain_id, LoginUser.email == row.user_email)).first()
                auth_token = user.auth_token

            _subscribe_for_drive_change(db_session, auth_token, row, False)
        else:
            row.channel_id = str(uuid.uuid4())
            _subscribe_for_activity(db_session, row, False)

        db_connection().commit()

    #If there are more subscriptions, call the api again with next page number    
    if len(subscription_list) == 50:
        messaging.trigger_get_event(urls.HANDLE_GDRIVE_CHANNEL_EXPIRATION_PATH, "Internal-Secret", {"page_num": page_num+1}, "gsuite")

    return "Subscription renewal completed"


def _subscribe_for_drive_change(db_session, auth_token, subscription, is_local_deployment):
    try:
        subscription.last_accessed = datetime.datetime.utcnow()
        subscription.notification_type = constants.GSuiteNotificationType.DRIVE_CHANGE.value

        drive_service = gutils.get_gdrive_service(auth_token, subscription.user_email, db_session)
        
        if not subscription.page_token:
            response = drive_service.changes().getStartPageToken().execute()
            if response and not 'startPageToken' in response:
                Logger().info("Start page token not received for user {} - {}".format(subscription.user_email, response))
                return
            subscription.page_token = response.get('startPageToken')

        if not subscription.page_token:
            Logger().info("Start page token not received for user {} - {}".format(subscription.user_email, response))
            return
            
        if not is_local_deployment:
            body = {
                "id": subscription.channel_id,
                "type": "web_hook",
                "address": constants.get_url_from_path(urls.PROCESS_DRIVE_NOTIFICATIONS_PATH),
                "token": subscription.datasource_id,
                "payload": "true",
                "params": {"ttl": 86100}
            }
            watch_response = drive_service.changes().watch(pageToken=subscription.page_token, restrictToMyDrive='true',
                                                        body=body).execute()
            Logger().info(" watch_response for a user :  {} ".format(watch_response))

            subscription.expire_at = subscription.last_accessed + timedelta(seconds=86100)
            if not subscription.resource_id:
                subscription.resource_id = watch_response['resourceId']
                subscription.resource_uri = watch_response['resourceUri']

    except Exception as ex:
        Logger().exception("Exception occurred while subscribing for drive change notifications for domain_id: {} datasource_id: {} channel_id: {} - {}".format(
            subscription.domain_id, subscription.datasource_id, subscription.channel_id, ex))

def _subscribe_for_activity(db_session, subscription, is_local_deployment):
    try:
        subscription.last_accessed = datetime.datetime.utcnow()
        if not subscription.page_token:
            subscription.page_token = subscription.last_accessed.isoformat("T") + "Z"

        if not is_local_deployment:
            reports_service = gutils.get_gdrive_reports_service(None, subscription.user_email, db_session)
            body = {
                "id": subscription.channel_id,
                "type": "web_hook",
                "address": constants.get_url_from_path(urls.PROCESS_ACTIVITY_NOTIFICATIONS_PATH),
                "token": subscription.datasource_id,
                "payload": "true",
                "params": {"ttl": 21300}
            }

            watch_response = reports_service.activities().watch(userKey='all', applicationName=subscription.notification_type, body=body).execute()

            Logger().info(" watch_response for all users :  {} ".format(watch_response))
            subscription.expire_at = subscription.last_accessed + timedelta(seconds=21300)
            if not subscription.resource_id:
                subscription.resource_id = watch_response['resourceId']
                subscription.resource_uri = watch_response['resourceUri']
    except Exception as ex:
        Logger().exception("Exception occurred while subscribing for {} activity notifications for domain_id: {} datasource_id: {} channel_id: {} - {}".format(
            subscription.notification_type, subscription.domain_id, subscription.datasource_id, subscription.channel_id, ex))


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
    datasource = db_session.query(DataSource).filter(DataSource.datasource_id == datasource_id).first()
    db_session.query(PushNotificationsSubscription).filter(
        PushNotificationsSubscription.datasource_id == datasource_id).delete()
    datasource.is_push_notifications_enabled = False
    db_connection().commit()

    login_user = db_session.query(LoginUser).filter(
        LoginUser.domain_id == datasource.domain_id).first()

    #Try subscribing for various activity notifications
    activities_to_track = [constants.GSuiteNotificationType.DRIVE_ACTIVITY.value, constants.GSuiteNotificationType.ADMIN_ACTIVITY.value, constants.GSuiteNotificationType.TOKEN_ACTIVITY.value, constants.GSuiteNotificationType.LOGIN_ACTIVITY.value]
    for activity in activities_to_track:
        subscription = prepare_new_subscription(datasource, login_user.email)
        subscription.notification_type = activity
        _subscribe_for_activity(db_session, subscription, is_local_deployment)    
        db_session.add(subscription)

    #Try subscribing for drive change notifications
    if datasource.is_serviceaccount_enabled:
        domain_users = db_session.query(DomainUser).filter(
            and_(DomainUser.datasource_id == datasource.datasource_id, DomainUser.type == constants.DirectoryEntityType.USER.value,
            DomainUser.member_type == 'INT')).all()
        for user in domain_users:
            subscription = prepare_new_subscription(datasource, user.email)
            subscription.drive_root_id = "SVC"
            _subscribe_for_drive_change(db_session, login_user.auth_token, subscription, is_local_deployment)
            db_session.add(subscription)
            db_connection().commit()
    else:
        Logger().info("Service account is not enabled, subscribing for push notification using logged in user's creds")
        subscription = prepare_new_subscription(datasource, login_user.email)
        subscription.drive_root_id = ""
        _subscribe_for_drive_change(db_session, login_user.auth_token, subscription, is_local_deployment)
        db_session.add(subscription)

    datasource.is_push_notifications_enabled = True
    db_connection().commit()

def prepare_new_subscription(datasource, user_email):
    subscription = PushNotificationsSubscription()
    subscription.domain_id = datasource.domain_id
    subscription.datasource_id = datasource.datasource_id
    subscription.channel_id = str(uuid.uuid4())
    subscription.drive_root_id = "SVC"
    subscription.in_progress = 0
    subscription.stale = 0
    subscription.user_email = user_email
    return subscription

def unsubscribe_subscription(subscription):
    try:
        if not subscription.resource_id:
            Logger().error("Subscription resource id is missing, hence ignoring unsubscription request...")
            return True

        notification_type = subscription.notification_type
        address = ''
        if notification_type == constants.GSuiteNotificationType.DRIVE_CHANGE.value:
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

        else:
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
        headers={"X-Goog-Channel-Token": row.datasource_id, "X-Goog-Channel-ID": row.channel_id, 'X-Goog-Resource-State': "adya"}
        if row.notification_type == constants.GSuiteNotificationType.DRIVE_CHANGE.value:
            messaging.trigger_post_event_with_headers(urls.PROCESS_DRIVE_NOTIFICATIONS_PATH, "Internal-Secret", {}, headers, {}, "gsuite")
        else:
            messaging.trigger_post_event_with_headers(urls.PROCESS_ACTIVITY_NOTIFICATIONS_PATH, "Internal-Secret", {}, headers, {}, "gsuite")

def unsubscribed_all_the_previous_subscription(datasource_id):
    db_session = db_connection().get_session()
    subscriptions = db_session.query(PushNotificationsSubscription).filter(PushNotificationsSubscription.datasource_id ==
                                                                          datasource_id).all()

    for subscription in subscriptions:
        unsubscribe_subscription(subscription)

    Logger().info("unsubscribed all the channel for datasource - {} ".format(datasource_id))