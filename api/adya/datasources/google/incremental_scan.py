from adya.datasources.google import gutils
from adya.db.connection import db_connection

from adya.db.models import PushNotificationsSubscription, Resource, ResourcePermission, DomainUser, \
    LoginUser, DataSource

from sqlalchemy import and_
from adya.common import constants, response_messages
from adya.common import utils, messaging, aws_utils
import requests
import uuid
#import datetime, timedelta
import datetime
from datetime import timedelta
import json

def handle_channel_expiration():
    db_session = db_connection().get_session()
    subscription_list = db_session.query(PushNotificationsSubscription).all()
    for row in subscription_list:
        access_time = datetime.datetime.utcnow().isoformat()
        expire_time = access_time
        try:
            is_service_account_enabled = True
            if row.channel_id == row.datasource_id:
                is_service_account_enabled = False

            body = {
                "id": row.channel_id,
                "type": "web_hook",
                "address": constants.get_url_from_path(constants.PROCESS_GDRIVE_NOTIFICATIONS_PATH),
                "token": row.datasource_id,
                "payload": "true",
                "params": {"ttl": 86400}
            }

            if is_service_account_enabled:
                drive_service = gutils.get_gdrive_service(None, row.user_email, db_session)
            else:
                user = db_session.query(LoginUser).filter(and_(LoginUser.domain_id == row.domain_id, LoginUser.email == row.user_email)).first()
                drive_service = gutils.get_gdrive_service(user.auth_token, row.user_email, db_session)

            if row.page_token == '':
                response = drive_service.changes().getStartPageToken().execute()
                row.page_token = response.get('startPageToken')
                print 'New start token: ', row.page_token

            print "Trying to renew subscription for push notifications for domain_id: {} datasource_id: {} channel_id: {}".format(
                row.domain_id, row.datasource_id, row.channel_id)

            response = drive_service.changes().watch(pageToken=row.page_token, body=body).execute()

            print "Response for push notifications renew subscription request for domain_id: {} datasource_id: {} channel_id: {} - {}".format(
                row.domain_id, row.datasource_id, row.channel_id, response)

            expire_time = access_time + timedelta(seconds=86400)
            
        except Exception as e:
            print e
            print "Exception occurred while trying to renew subscription for push notifications for domain_id: {} datasource_id: {} channel_id: {}".format(
                row.domain_id, row.datasource_id, row.channel_id)

        row.last_accessed = access_time
        row.expire_at = expire_time
    db_connection().commit()

    return "Subscription renewal completed"

def subscribe(domain_id, datasource_id):
    db_session = db_connection().get_session()
    try:
        # set up a resubscribe handler that runs every midnight cron(0 0 ? * * *)
        aws_utils.create_cloudwatch_event("handle_channel_expiration", "cron(0 0 ? * * *)", aws_utils.get_lambda_name("get", constants.HANDLE_GDRIVE_CHANNEL_EXPIRATION_PATH))

        datasource = db_session.query(DataSource).filter(DataSource.datasource_id == datasource_id).first()
        db_session.query(PushNotificationsSubscription).filter(
            PushNotificationsSubscription.datasource_id == datasource_id).delete()
        datasource.is_push_notifications_enabled = False
        db_connection().commit()

        login_user = db_session.query(LoginUser).filter(LoginUser.domain_id == datasource.domain_id).first()
        if datasource.is_serviceaccount_enabled:
            domain_users = db_session.query(DomainUser).filter(and_(DomainUser.datasource_id == datasource.datasource_id, DomainUser.member_type == 'INT')).all()
            print "Got {} users to subscribe for push notifications for datasource_id: {}".format(len(domain_users), datasource.datasource_id)
            for user in domain_users:
                print "Subscribing for push notification for user {}".format(user.email)
                _subscribe_for_user(db_session, login_user.auth_token, datasource, user.email, user.user_id)
        else:
            print "Service account is not enabled, subscribing for push notification using logged in user's creds"
            _subscribe_for_user(db_session, login_user.auth_token, datasource, login_user.email, datasource.datasource_id)

        datasource.is_push_notifications_enabled = True
        db_connection().commit()
    except Exception as e:
        print "Exception occurred while requesting push notifications subscription for domain_id: {} datasource_id: {} - {}".format(
            domain_id, datasource_id, e)
    
def _subscribe_for_user(db_session, auth_token, datasource, email, channel_id):
    access_time = datetime.datetime.utcnow().isoformat()
    expire_time = access_time
    start_token = ''
    try:
        drive_service = gutils.get_gdrive_service(auth_token, email, db_session)
        body = {
            "id": channel_id,
            "type": "web_hook",
            "address": constants.get_url_from_path(constants.PROCESS_GDRIVE_NOTIFICATIONS_PATH),
            "token": datasource.datasource_id,
            "payload": "true",
            "params": {"ttl": 86400}
        }

        response = drive_service.changes().getStartPageToken().execute()
        start_token = response.get('startPageToken')
        print 'Start token: ', start_token

        watch_response = drive_service.changes().watch(pageToken=start_token, body=body).execute()
        print " watch_response for a user : ", watch_response
        expire_time = access_time + timedelta(seconds=86400)
    
    except Exception as ex:
        print "Exception occurred while subscribing for push notifications for domain_id: {} datasource_id: {} channel_id: {} - {}".format(
            datasource.domain_id, datasource.datasource_id, channel_id, ex)

    push_notifications_subscription = PushNotificationsSubscription()
    push_notifications_subscription.domain_id = datasource.domain_id
    push_notifications_subscription.datasource_id = datasource.datasource_id
    push_notifications_subscription.channel_id = channel_id
    push_notifications_subscription.drive_root_id = ''
    push_notifications_subscription.page_token = start_token
    push_notifications_subscription.in_progress = 0
    push_notifications_subscription.stale = 0
    push_notifications_subscription.user_email = email
    push_notifications_subscription.last_accessed = access_time
    push_notifications_subscription.expire_at = expire_time
    db_session.add(push_notifications_subscription)

def process_notifications(datasource_id, channel_id):
    print "Processing Subscription notification for datasource_id: {} and channel_id: {}.".format(
                    datasource_id, channel_id)
    db_session = db_connection().get_session()
    try:
        datasource = db_session.query(DataSource).filter(DataSource.datasource_id == datasource_id).first()
        login_user = db_session.query(LoginUser).filter(LoginUser.domain_id == datasource.domain_id).first()
        user_email = login_user.email
        if datasource.datasource_id != channel_id:
            user = db_session.query(DomainUser).filter(DomainUser.user_id == channel_id).first()
            user_email = user.email
        drive_service = gutils.get_gdrive_service(
            login_user.auth_token, user_email, db_session)

        subscription = db_session.query(PushNotificationsSubscription).filter(and_(PushNotificationsSubscription.channel_id == channel_id,
                                                                                   PushNotificationsSubscription.datasource_id == datasource_id)).first()
        if not subscription:
            print "Subscription does not exist for datasource_id: {} and channel_id: {}, hence ignoring the notification.".format(
                datasource_id, channel_id)

        if subscription.in_progress == 1:
            if subscription.stale == 0:
                subscription.stale = 1
                db_connection().commit()
                print "Subscription already in progress  for datasource_id: {} and channel_id: {}, hence marking it stale and returning.".format(
                    datasource_id, channel_id)
            else:
                print "Subscription already in progress and marked stale for datasource_id: {} and channel_id: {}, hence directly returning.".format(
                    datasource_id, channel_id)

            return

        should_mark_in_progress = True

        page_token = subscription.page_token
        print "process_notifications : page_token ", page_token
        while True:
            response = drive_service.changes().list(pageToken=page_token,
                                                    spaces='drive').execute()
            #Mark Inprogress
            if should_mark_in_progress:
                print "should_mark_in_progress "
                db_session.refresh(subscription)
                subscription.in_progress = 1
                subscription.last_accessed = datetime.datetime.utcnow().isoformat()
                db_connection().commit()
                should_mark_in_progress = False

            print response
            for change in response.get('changes'):
                # Process change
                fileId = change.get('fileId')
                print 'Change found for file: %s' % fileId
                print change

                handle_change(drive_service, datasource.domain_id,
                              datasource.datasource_id, user_email, fileId)

            if 'newStartPageToken' in response:
                # Last page, save this token for the next polling interval
                page_token = response.get('newStartPageToken')
                break

        db_session.refresh(subscription)
        if page_token != subscription.page_token:
            subscription.page_token = page_token
        subscription.last_accessed = datetime.datetime.utcnow().isoformat()
        subscription.in_progress = 0
        db_connection().commit()

        db_session.refresh(subscription)
        if subscription.stale == 1:
            subscription.stale = 0
            db_connection().commit()
            response = requests.post(constants.get_url_from_path(constants.PROCESS_GDRIVE_NOTIFICATIONS_PATH),
                                     headers={"X-Goog-Channel-Token": datasource_id,
                                              "X-Goog-Channel-ID": channel_id})

    except Exception as e:
        print "Exception occurred while processing push notification for datasource_id: {} channel_id: {} - {}".format(
            datasource_id, channel_id, e)
    

def handle_change(drive_service, domain_id, datasource_id, email, file_id):
    db_session = db_connection().get_session()
    try:
        results = drive_service.files() \
            .get(fileId=file_id, fields="id, name, webContentLink, webViewLink, iconLink, "
                 "thumbnailLink, description, lastModifyingUser, mimeType, parents, "
                 "permissions(id, emailAddress, role, displayName, expirationTime, deleted),"
                 "owners,size,createdTime, modifiedTime").execute()
        print("results : ", results)
        db_session.query(ResourcePermission).filter(
            ResourcePermission.resource_id == file_id).delete(synchronize_session=False)
        db_session.query(Resource).filter(Resource.resource_id ==
                                          file_id).delete(synchronize_session=False)
        db_connection().commit()

        resourcedata = {}
        resourcedata["resources"] = [results]

        query_params = {'domainId': domain_id,'dataSourceId': datasource_id,'ownerEmail':email, 'userEmail': email}
        messaging.trigger_post_event(
            constants.SCAN_RESOURCES, "Internal-Secret", query_params, resourcedata)
        messaging.send_push_notification("adya-"+datasource_id, json.dumps({"type": "incremental_change", "domain_id": domain_id, "datasource_id": datasource_id, "email": email, "resource": results}))


        #filedata = results['files']
        #TODO: policy check for the above action .
        # payload = {"affected_entity_type": 'file', "affected_entity_id": filedata['id'], "actor_id": filedata['permissions']['id'],
        #            "action_type": filedata['permissions']['role']}

        # policy_respone = policy_controller.policy_checker(auth_token, payload, db_session)

    except Exception as e:
        print "Exception occurred while processing the change notification for domain_id: {} datasource_id: {} email: {} file_id: {} - {}".format(
            domain_id, datasource_id, email, file_id, e)


def unsubscribe_for_a_user(db_session, auth_token, datasource_id):
    try:
        drive_service = gutils.get_gdrive_service(auth_token, None, db_session)
        subscription_list = db_session.query(PushNotificationsSubscription).all()
        for row in subscription_list:
            print "trying to unsubscribe the channel "
            if row.datasource_id == datasource_id:
                body = {
                    "id": row.channel_id,
                    "type": "web_hook",
                    "address": constants.get_url_from_path(constants.PROCESS_GDRIVE_NOTIFICATIONS_PATH),
                    "token": row.datasource_id,
                    "payload": "true",
                    "params": {"ttl": 86400}
                }

                response = drive_service.channels.stop(body=body)
                print response
                print "unsubscription for datasource id: {} and channel id: {}".format(datasource_id, row.channel_id)

        #delete the entry from database
        db_session.query(PushNotificationsSubscription).filter(PushNotificationsSubscription.datasource_id == datasource_id).delete()
        db_connection().commit()
        return response

    except Exception as ex:
        print "Exception occurred while unsubscribing for push notifications for datasource_id: {} - {}".format(
            datasource_id, ex)
        print json.loads(ex.content)
        return json.loads(ex.content)
