import datetime

import requests

from adya.common.constants import urls
from adya.common.constants.constants import get_url_from_path
from adya.common.db.connection import db_connection
from adya.common.db.models import PushNotificationsSubscription, LoginUser, DataSource
from adya.common.utils import messaging
from adya.common.utils.response_messages import Logger
from adya.gsuite import gutils


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
            Logger().warn("Subscription already in progress for channel_id: {}, hence marking it stale and returning.".format(channel_id))
        else:
            Logger().warn("Subscription already in progress and marked stale for channel_id: {}, hence directly returning.".format(channel_id))
        return

    user_email = subscription.user_email
    try:
        drive_service = None
        if not subscription.drive_root_id == "SVC":
            login_user = db_session.query(LoginUser).filter(LoginUser.email == subscription.user_email).first()
            drive_service = gutils.get_gdrive_service(login_user.auth_token, user_email, db_session)
        else:
            drive_service = gutils.get_gdrive_service(None, user_email, db_session)
        should_mark_in_progress = True

        page_token = subscription.page_token
        while True:
            response = drive_service.changes().list(pageToken=page_token, restrictToMyDrive='true',
                                                    spaces='drive').execute()
            Logger().info("Processing following change notification for user: {} with page token: {} = changes - {}".format(user_email, page_token, response))
            changes = response.get('changes')
            if len(changes) < 1:
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

            for change in changes:
                # Process change
                fileId = change.get('fileId')
                handle_change(drive_service, datasource_id, user_email, fileId)

            if 'nextPageToken' in response:
                # More changes available, so continue fetching changes with the updated page token
                page_token = response.get('nextPageToken')
            elif 'newStartPageToken' in response:
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
            response = requests.post(get_url_from_path(urls.PROCESS_DRIVE_NOTIFICATIONS_PATH),
                                     headers={"X-Goog-Channel-Token": datasource_id,
                                              "X-Goog-Channel-ID": channel_id,
                                              'X-Goog-Resource-State': notification_type})

    except Exception as e:
        Logger().exception( "Exception occurred while processing push notification for user: {}, datasource_id: {} channel_id: {} - {}".format(
            user_email, datasource_id, channel_id, e))


def handle_change(drive_service, datasource_id, email, file_id):
    db_session = db_connection().get_session()
    try:
        results = drive_service.files() \
            .get(fileId=file_id, fields="id, name, webContentLink, webViewLink, iconLink, "
                                        "thumbnailLink, description, lastModifyingUser, mimeType, parents, "
                                        "permissions(id, emailAddress, role, displayName, expirationTime, deleted),"
                                        "owners,size,createdTime, modifiedTime").execute()
        Logger().info("Updated resource for change notification is - {}".format(results))

        if results and results['owners'][0]['emailAddress'] != email:
            Logger().warn("Owner of the file is not same as subscribed user, hence ignoring. Owner email : {} and subscribed user email : {}".\
                format(results['owners'][0]['emailAddress'], email))
            return

        if results and not "permissions" in results:
            Logger().warn("Permissions not found for this resource, something wrong, hence ignoring. Owner email : {} and subscribed user email : {}".\
                format(results['owners'][0]['emailAddress'], email))
            return

        resourcedata = {}
        resourcedata["resources"] = [results]
        datasource = db_session.query(DataSource).filter(DataSource.datasource_id == datasource_id).first()
        query_params = {'domainId': datasource.domain_id, 'dataSourceId': datasource_id, 'ownerEmail': email,
                        'userEmail': email, 'is_incremental_scan': 1}
        messaging.trigger_post_event(urls.SCAN_RESOURCES, "Internal-Secret", query_params, resourcedata, "gsuite")

    except Exception as e:
        Logger().exception("Exception occurred while processing the change notification for datasource_id: {} email: {} file_id: {} - {}".format(
            datasource_id, email, file_id, e))
