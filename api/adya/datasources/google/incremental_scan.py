from adya.datasources.google import gutils
from adya.datasources.google.permission import GetPermission
from adya.db.connection import db_connection
from adya.db.models import PushNotificationsSubscription, Resource, ResourcePermission, ResourceParent, DomainUser
from adya.controllers import domain_controller
from sqlalchemy import and_
from adya.common import constants
from adya.common import utils, messaging
import requests
import uuid
import datetime
import json


def subscribe(domain_id, datasource_id):

    try:
        db_session = db_connection().get_session()
        datasource = domain_controller.get_datasource(
            None, datasource_id, db_session)
        db_session.query(PushNotificationsSubscription).filter(
            PushNotificationsSubscription.datasource_id == datasource_id).delete()
        datasource.is_push_notifications_enabled = False
        db_session.commit()
        if datasource.is_serviceaccount_enabled:
            domain_users = db_session.query(DomainUser).filter(and_(DomainUser.datasource_id == datasource_id, DomainUser.member_type == 'INT')).all()
            for user in domain_users:
                print "Subscribing for push notification for user {}".format(user.email)
                _subscribe_for_user(db_session, datasource, user.email)
        else:
            print "Service account is not enabled, subscribing for push notification using logged in user's creds"
            _subscribe_for_user(db_session, datasource, None)

        datasource.is_push_notifications_enabled = True
        db_session.commit()
    except Exception as e:
        print "Exception occurred while requesting push notifications subscription for domain_id: {} datasource_id: {} - {}".format(
            domain_id, datasource_id, e)


def _subscribe_for_user(db_session, datasource, user_email):
    drive_service = gutils.get_gdrive_service(datasource.domain_id, user_email)
    root_file = drive_service.files().get(fileId='root').execute()
    print("Subscribe : Got Drive root ", root_file)
    root_file_id = root_file['id']

    channel_id = datasource.datasource_id
    if user_email:
        channel_id = user_email

    body = {
        "id": channel_id,
        "type": "web_hook",
        "address": constants.get_url_from_path(constants.PROCESS_GDRIVE_NOTIFICATIONS_PATH),
        "token": datasource.datasource_id,
        "payload": "true",
        "params": {"ttl": 1800}
    }
    print "Trying to subscribe for push notifications for domain_id: {} datasource_id: {} channel_id: {}".format(
        datasource.domain_id, datasource.datasource_id, channel_id)
    response = drive_service.files().watch(fileId=root_file_id, body=body).execute()
    print "Response for push notifications subscription request for domain_id: {} datasource_id: {} channel_id: {} - {}".format(
        datasource.domain_id, datasource.datasource_id, channel_id, response)

    response = drive_service.changes().getStartPageToken().execute()
    print 'Start token: %s' % response.get('startPageToken')

    push_notifications_subscription = PushNotificationsSubscription()
    push_notifications_subscription.domain_id = datasource.domain_id
    push_notifications_subscription.datasource_id = datasource.datasource_id
    push_notifications_subscription.channel_id = channel_id
    push_notifications_subscription.page_token = response.get('startPageToken')
    push_notifications_subscription.in_progress = 0
    push_notifications_subscription.stale = 0
    db_session.add(push_notifications_subscription)


def process_notifications(auth_token, datasource_id, channel_id):
    try:
        datasource = domain_controller.get_datasource(None, datasource_id)
        user_email = None
        if datasource.datasource_id != channel_id:
            user_email = channel_id
        drive_service = gutils.get_gdrive_service(
            datasource.domain_id, user_email)

        db_session = db_connection().get_session()
        subscription = db_session.query(PushNotificationsSubscription).filter(and_(PushNotificationsSubscription.channel_id == channel_id,
                                                                                   PushNotificationsSubscription.datasource_id == datasource_id)).first()
        if not subscription:
            print "Subscription does not exist for datasource_id: {} and channel_id: {}, hence ignoring the notification.".format(
                datasource_id, channel_id)

        if subscription.in_progress == 1:
            if subscription.stale == 0:
                subscription.stale = 1
                db_session.commit()
                print "Subscription already in progress  for datasource_id: {} and channel_id: {}, hence marking it stale and returning.".format(
                    datasource_id, channel_id)
            else:
                print "Subscription already in progress and marked stale for datasource_id: {} and channel_id: {}, hence directly returning.".format(
                    datasource_id, channel_id)

            return

        should_mark_in_progress = True
        page_token = subscription.page_token
        while page_token is not None:
            response = drive_service.changes().list(pageToken=page_token,
                                                    spaces='drive').execute()
            #Mark Inprogress
            if should_mark_in_progress:
                db_session.refresh(subscription)
                subscription.in_progress = 1
                db_session.commit()
                should_mark_in_progress = False

            print response
            for change in response.get('changes'):
                # Process change
                fileId = change.get('fileId')
                print 'Change found for file: %s' % fileId
                print change

                handle_change(auth_token, drive_service, datasource.domain_id,
                              datasource.datasource_id, channel_id, fileId)

            if 'newStartPageToken' in response:
                # Last page, save this token for the next polling interval
                page_token = response.get('nextPageToken')

        db_session.refresh(subscription)
        if page_token != subscription.page_token:
            subscription.page_token = page_token
        subscription.last_accessed = datetime.datetime.utcnow().isoformat()
        subscription.in_progress = 0
        db_session.commit()

        db_session.refresh(subscription)
        if subscription.stale == 1:
            subscription.stale = 0
            db_session.commit()
            response = requests.post(constants.get_url_from_path(constants.PROCESS_GDRIVE_NOTIFICATIONS_PATH),
                                     headers={"X-Goog-Channel-Token": datasource_id,
                                              "X-Goog-Channel-ID": channel_id})
            print response

    except Exception as e:
        print "Exception occurred while processing push notification for datasource_id: {} channel_id: {} - {}".format(
            datasource_id, channel_id, e)


def handle_change(auth_token, drive_service, domain_id, datasource_id, channel_id, file_id):
    try:
        db_session = db_connection().get_session()
        results = drive_service.files() \
            .get(fileId=file_id, fields="files(id, name, webContentLink, webViewLink, iconLink, "
                 "thumbnailLink, description, lastModifyingUser, mimeType, parents, "
                 "permissions(id, emailAddress, role, displayName, expirationTime, deleted),"
                 "owners,size,createdTime, modifiedTime)").execute()
        print("results : ", results)

        db_session.query(ResourceParent).filter(
            ResourceParent.resource_id == file_id).delete(synchronize_session=False)
        db_session.query(ResourcePermission).filter(
            ResourcePermission.resource_id == file_id).delete(synchronize_session=False)
        db_session.query(Resource).filter(Resource.resource_id ==
                                          file_id).delete(synchronize_session=False)
        db_session.commit()

        resourcedata = {}
        resourcedata["resources"] = results['files']

        query_params = {'domainId': domain_id,
                        'dataSourceId': datasource_id, 'userEmail': channel_id}
        messaging.trigger_post_event(
            constants.SCAN_RESOURCES, auth_token, query_params, resourcedata)
        messaging.send_push_notification("adya-scan-incremental-update", json.dumps({"domain_id": domain_id, "datasource_id": datasource_id, "channel_id": channel_id, "file_id": file_id}))
    except Exception as e:
        print "Exception occurred while processing the change notification for domain_id: {} datasource_id: {} channel_id: {} file_id: {} - {}".format(
            domain_id, datasource_id, channel_id, file_id, e)
