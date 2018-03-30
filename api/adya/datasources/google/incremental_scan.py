from adya.datasources.google import gutils
from adya.db.connection import db_connection

from adya.db.models import PushNotificationsSubscription, Resource, ResourcePermission, DomainUser, \
    LoginUser, DataSource, alchemy_encoder

from sqlalchemy import and_
from adya.common import constants, response_messages
from adya.common import utils, messaging, aws_utils
import requests
import uuid
#import datetime, timedelta
import datetime, dateutil.parser
from datetime import timedelta
import json

def handle_channel_expiration():
    db_session = db_connection().get_session()
    subscription_list = db_session.query(PushNotificationsSubscription).all()
    for row in subscription_list:
        access_time = datetime.datetime.utcnow()
        expire_time = access_time
        if row.expire_at > access_time and row.expire_at < (access_time + timedelta(seconds=86100)):
            #Unsubscribe and subscribe again
            unsubscribe_for_a_user(row)

        try:
            is_service_account_enabled = False
            if row.drive_root_id == "SVC":
                is_service_account_enabled = True

            body = {
                "id": row.channel_id,
                "type": "web_hook",
                "address": constants.get_url_from_path(constants.PROCESS_GDRIVE_NOTIFICATIONS_PATH),
                "token": row.datasource_id,
                "payload": "true",
                "params": {"ttl": 86100}
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

            response = drive_service.changes().watch(pageToken=row.page_token, restrictToMyDrive='true', body=body).execute()

            print "Response for push notifications renew subscription request for domain_id: {} datasource_id: {} channel_id: {} - {}".format(
                row.domain_id, row.datasource_id, row.channel_id, response)

            expire_time = access_time + timedelta(seconds=86100)
            row.resource_id = response['resourceId']
            row.resource_uri = response['resourceUri']
            
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

        # watch on userlist
        # directory_service = gutils.get_directory_service(login_user.auth_token)
        # body = {
        #     "id": datasource.datasource_id,
        #     "type": "web_hook",
        #     "address": constants.get_url_from_path(constants.PROCESS_GDRIVE_NOTIFICATIONS_PATH),
        #     "payload": "true",
        #     "params": {"ttl": 1800}
        # }
        #
        # print "subscribe userlist : body : ", body
        #
        # watch_userlist_response = directory_service.users().watch(projection="full", showDeleted="true",
        #                                                           event="add", body=body)
        #
        # print "subbscribe userlist : watch_userlist_response : ", watch_userlist_response

        if datasource.is_serviceaccount_enabled:
            domain_users = db_session.query(DomainUser).filter(and_(DomainUser.datasource_id == datasource.datasource_id, DomainUser.member_type == 'INT')).all()
            print "Got {} users to subscribe for push notifications for datasource_id: {}".format(len(domain_users), datasource.datasource_id)
            for user in domain_users:
                print "Subscribing for push notification for user {}".format(user.email)
                _subscribe_for_user(db_session, login_user.auth_token, datasource, user.email)
        else:
            print "Service account is not enabled, subscribing for push notification using logged in user's creds"
            _subscribe_for_user(db_session, login_user.auth_token, datasource, login_user.email)

        datasource.is_push_notifications_enabled = True
        db_connection().commit()
    except Exception as e:
        print "Exception occurred while requesting push notifications subscription for domain_id: {} datasource_id: {} - {}".format(
            domain_id, datasource_id, e)
    

def _subscribe_for_user(db_session, auth_token, datasource, email):
    channel_id = str(uuid.uuid4())
    access_time = datetime.datetime.utcnow()
    expire_time = access_time
    start_token = ''
    resource_id = ''
    resource_uri = ''
    try:
        drive_service = gutils.get_gdrive_service(auth_token, email, db_session)
        body = {
            "id": channel_id,
            "type": "web_hook",
            "address": constants.get_url_from_path(constants.PROCESS_GDRIVE_NOTIFICATIONS_PATH),
            "token": datasource.datasource_id,
            "payload": "true",
            "params": {"ttl": 86100}
        }

        response = drive_service.changes().getStartPageToken().execute()
        start_token = response.get('startPageToken')
        print 'Start token: ', start_token

        watch_response = drive_service.changes().watch(pageToken=start_token, restrictToMyDrive='true', body=body).execute()
        print " watch_response for a user : ", watch_response

        expire_time = access_time + timedelta(seconds=86100)
        resource_id = watch_response['resourceId']
        resource_uri = watch_response['resourceUri']

    
    except Exception as ex:
        print "Exception occurred while subscribing for push notifications for domain_id: {} datasource_id: {} channel_id: {} - {}".format(
            datasource.domain_id, datasource.datasource_id, channel_id, ex)

    push_notifications_subscription = PushNotificationsSubscription()
    push_notifications_subscription.domain_id = datasource.domain_id
    push_notifications_subscription.datasource_id = datasource.datasource_id
    push_notifications_subscription.channel_id = channel_id
    push_notifications_subscription.drive_root_id = "SVC" if datasource.is_serviceaccount_enabled else ""
    push_notifications_subscription.page_token = start_token
    push_notifications_subscription.in_progress = 0
    push_notifications_subscription.stale = 0
    push_notifications_subscription.user_email = email
    push_notifications_subscription.last_accessed = access_time
    push_notifications_subscription.expire_at = expire_time
    push_notifications_subscription.resource_id = resource_id
    push_notifications_subscription.resource_uri = resource_uri
    db_session.add(push_notifications_subscription)


def process_notifications(notification_type, datasource_id, channel_id):
    print "Processing Subscription notification type - {} for datasource_id: {} and channel_id: {}.".format(notification_type,
                    datasource_id, channel_id)
    
    if notification_type == "sync":
        print "Sync notification received, ignore..."
        return
    
    db_session = db_connection().get_session()

    subscription = db_session.query(PushNotificationsSubscription).filter(PushNotificationsSubscription.channel_id == channel_id).first()
    if not subscription:
        print "Subscription does not exist for datasource_id: {} and channel_id: {}, hence ignoring the notification.".format(
            datasource_id, channel_id)
        return
    user_email = subscription.user_email
    try:
        subscribed_user = db_session.query(DomainUser).filter(and_(DomainUser.email == subscription.user_email, DomainUser.member_type == 'INT')).first()
        if not subscribed_user:
            print "Subscribed user does not exist, hence ignoring the notification"
            return

        drive_service = None
        if not subscription.drive_root_id == "SVC":
            login_user = db_session.query(LoginUser).filter(LoginUser.email == subscription.user_email).first()
            drive_service = gutils.get_gdrive_service(login_user.auth_token, user_email, db_session)
        else:
            drive_service = gutils.get_gdrive_service(None, user_email, db_session)

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
            response = drive_service.changes().list(pageToken=page_token, restrictToMyDrive='true',
                                                    spaces='drive').execute()
            print "Changes for this notification found are - {}".format(response)
            #Mark Inprogress
            if should_mark_in_progress:
                print "Marking the subscription to be in progress "
                db_session.refresh(subscription)
                subscription.in_progress = 1
                subscription.last_accessed = datetime.datetime.utcnow()
                db_connection().commit()
                should_mark_in_progress = False

            
            for change in response.get('changes'):
                # Process change
                fileId = change.get('fileId')
                handle_change(drive_service, datasource_id, user_email, fileId)

            if 'newStartPageToken' in response:
                # Last page, save this token for the next polling interval
                page_token = response.get('newStartPageToken')
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
            response = requests.post(constants.get_url_from_path(constants.PROCESS_GDRIVE_NOTIFICATIONS_PATH),
                                        headers={"X-Goog-Channel-Token": datasource_id,
                                                "X-Goog-Channel-ID": channel_id, 'X-Goog-Resource-State':notification_type})


    except Exception as e:
        print "Exception occurred while processing push notification for datasource_id: {} channel_id: {} - {}".format(
            datasource_id, channel_id, e)
    

def handle_change(drive_service, datasource_id, email, file_id):
    print 'Handling the change for file: %s' % file_id
    db_session = db_connection().get_session()
    try:
        results = drive_service.files() \
            .get(fileId=file_id, fields="id, name, webContentLink, webViewLink, iconLink, "
                 "thumbnailLink, description, lastModifyingUser, mimeType, parents, "
                 "permissions(id, emailAddress, role, displayName, expirationTime, deleted),"
                 "owners,size,createdTime, modifiedTime").execute()
        print "Updated resource for change notification is - {}".format(results)
        last_modified_time = dateutil.parser.parse(results['modifiedTime'])

        resource = db_session.query(Resource).filter(and_(Resource.resource_id == file_id, Resource.datasource_id == datasource_id)).first()
        
        if resource and resource.last_modified_time < last_modified_time:
            print "Resource not found which is modified prior to: {}, hence ignoring...".format(last_modified_time)
            return

        perms = []

        is_new_resource = 0
        if resource:
            perms = resource.permissions
            print "Modified time of the changed resource is - {}, and stored resource is {}".format(last_modified_time, resource.last_modified_time)
            print "Deleting the existing permissions and resource, and add again"
            db_session.query(ResourcePermission).filter(and_(ResourcePermission.resource_id == file_id, ResourcePermission.datasource_id == datasource_id)).delete(synchronize_session=False)
            db_session.query(Resource).filter(and_(Resource.resource_id == file_id, Resource.datasource_id == datasource_id)).delete(synchronize_session=False)
            db_connection().commit()
        else:
            is_new_resource = 1
            print "Resource does not exist in DB, so would add it now"

        existing_permissions = json.dumps(perms, cls=alchemy_encoder())

        resourcedata = {}
        resourcedata["resources"] = [results]
        datasource = db_session.query(DataSource).filter(DataSource.datasource_id == datasource_id).first()
        query_params = {'domainId': datasource.domain_id,'dataSourceId': datasource_id, 'ownerEmail': email, 
        'userEmail': email, 'is_new_resource': is_new_resource, 'notify_app': 1}
        messaging.trigger_post_event(constants.SCAN_RESOURCES, "Internal-Secret", query_params, resourcedata)
        
        payload = {}
        payload["old_permissions"] = existing_permissions
        payload["resource"] = results
        policy_params = {'dataSourceId': datasource_id, 'resourceId': file_id}
        #messaging.trigger_post_event(constants.POLICIES_VALIDATE_PATH, "Internal-Secret", policy_params, payload)

    except Exception as e:
        print "Exception occurred while processing the change notification for datasource_id: {} email: {} file_id: {} - {}".format(
            datasource_id, email, file_id, e)


def unsubscribe_for_a_user(subscription):
    try:
        if not subscription.resource_id:
            print "Subscription resource id is missing, hence ignoring unsubscription request..."
            return

        drive_service = gutils.get_gdrive_service(None, subscription.user_email)
        body = {
            "id": subscription.channel_id,
            "type": "web_hook",
            "address": constants.get_url_from_path(constants.PROCESS_GDRIVE_NOTIFICATIONS_PATH),
            "token": subscription.datasource_id,
            "payload": "true",
            "params": {"ttl": 86100},
            "resourceId": subscription.resource_id,
            "resourceUri": subscription.resource_uri
        }
        print "trying to unsubscribe the channel with body - {}".format(body)
        unsubscribe_response = drive_service.channels().stop(body=body).execute()
        print "google unsubscribe response : ", unsubscribe_response
        return True

    except Exception as ex:
        print "Exception occurred while unsubscribing for push notifications for - {}".format(ex)
        return False
