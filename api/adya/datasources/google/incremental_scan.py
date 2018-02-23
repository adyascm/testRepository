from adya.datasources.google import gutils
from adya.datasources.google.permission import GetPermission
from adya.db.connection import db_connection
from adya.db.models import PushNotificationsSubscription, Resource, ResourcePermission
from adya.controllers import domain_controller
from sqlalchemy import and_
from adya.common import constants
import requests
import uuid
import datetime

def subscribe(domain_id, datasource_id, user_email):

    try:
        db_session = db_connection().get_session()
        existing_subscriptions_count = db_session.query(PushNotificationsSubscription).filter(and_(PushNotificationsSubscription.domain_id == domain_id,PushNotificationsSubscription.datasource_id == datasource_id)).count()
        subscription_exist = False
        if existing_subscriptions_count > 0:
            subscription_exist = True
            if user_email:
                existing_subscription_count_for_user = db_session.query(PushNotificationsSubscription).filter(and_(PushNotificationsSubscription.domain_id == domain_id,PushNotificationsSubscription.datasource_id == datasource_id, PushNotificationsSubscription.channel_id == user_email)).count()
                subscription_exist = existing_subscription_count_for_user > 0

        if subscription_exist:
            print "Push notification subscription already exist for domain_id: {} datasource_id: {} user_email: {}".format(domain_id, datasource_id, user_email)
            return
        
        drive_service = gutils.get_gdrive_service(domain_id=domain_id, user_email=user_email)

        root_file = drive_service.files().get(fileId='root').execute()
        print("Subscribe : Got Drive root ", root_file)
        root_file_id = root_file['id']

        channel_id = datasource_id
        if user_email:
            channel_id = user_email

        body = {
            "id": channel_id,
            "type": "web_hook",
            "address": constants.get_url_from_path(constants.PROCESS_GDRIVE_NOTIFICATIONS_PATH),
            "token": datasource_id,
            "payload": "true",
            "params": {"ttl": 1800}

        }
        print "Trying to subscribe for push notifications for domain_id: {} datasource_id: {} user_email: {}".format(domain_id, datasource_id, user_email)
        response = drive_service.files().watch(fileId=root_file_id, body=body).execute()
        print "Response for push notifications subscription request for domain_id: {} datasource_id: {} user_email: {} - {}".format(domain_id, datasource_id, user_email, response)


        response = drive_service.changes().getStartPageToken().execute()
        print 'Start token: %s' % response.get('startPageToken')

        push_notifications_subscription = PushNotificationsSubscription()
        push_notifications_subscription.domain_id = domain_id
        push_notifications_subscription.datasource_id = datasource_id
        push_notifications_subscription.channel_id = channel_id
        push_notifications_subscription.page_token = response.get('startPageToken')
        push_notifications_subscription.in_progress = 0
        push_notifications_subscription.stale = 0

        db_session.add(push_notifications_subscription)
        db_session.commit()
    except Exception as e:
        print "Exception occurred while requesting push notifications subscription for domain_id: {} datasource_id: {} user_email: {} - {}".format(domain_id, datasource_id, user_email, e)

def process_notifications(datasource_id, channel_id):
    try:
        datasource = domain_controller.get_datasource(None, datasource_id)
        user_email = None
        if datasource.datasource_id != channel_id:
            user_email = channel_id
        drive_service = gutils.get_gdrive_service(datasource.domain_id, user_email)

        db_session = db_connection().get_session()
        subscription = db_session.query(PushNotificationsSubscription).filter(and_(PushNotificationsSubscription.channel_id == channel_id,
                                                               PushNotificationsSubscription.datasource_id == datasource_id)).first()
        if not subscription:
            print "Subscription does not exist for datasource_id: {} and channel_id: {}, hence ignoring the notification.".format(datasource_id, channel_id)

        if subscription.in_progress == 1:
            if subscription.stale == 0:
                subscription.stale = 1
                db_session.commit()
                print "Subscription already in progress  for datasource_id: {} and channel_id: {}, hence marking it stale and returning.".format(datasource_id, channel_id)
            else:
                print "Subscription already in progress and marked stale for datasource_id: {} and channel_id: {}, hence directly returning.".format(datasource_id, channel_id)

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

                handle_change(drive_service, datasource.domain_id, datasource.datasource_id, fileId)

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
        print "Exception occurred while processing push notification for datasource_id: {} channel_id: {} - {}".format(datasource_id, channel_id, e)

def handle_change(drive_service, domain_id, datasource_id, file_id):
    immediate_parent = ""
    path = ""
    curr_resource = file_id
    file_name = ""
    file_type = 'F'

    try:
        db_session = db_connection().get_session()
        results = drive_service.files() \
            .get(fileId=curr_resource, fields="parents, name, mimeType, owners," + \
                                              " size, createdTime, modifiedTime").execute()
        print("results : ", results)

        file_name = results['name']
        if results['mimeType'].endswith("folder"):
            file_type = 'D'

        if results.get('parents'):
            parent = results['parents']
            if (len(parent) == 1):
                immediate_parent = parent[0]

        print("Immediate Parent is: " + immediate_parent)

        if immediate_parent == '':
            immediate_parent = constants.ROOT

        file_owner = results['owners'][0].get('emailAddress')
        file_size = results.get('size')
        created_time = results['createdTime'][:-1]
        last_modified_time = results['modifiedTime'][:-1]


        row = db_session.query(Resource).filter(and_(Resource.domain_id == domain_id,
                                                        Resource.datasource_id == datasource_id,
                                                        Resource.resource_id == file_id)).first()
        resource_id_exists = False
        if row is not None:
            resource_id_exists = True

        if resource_id_exists:
            resource = db_session.query(Resource).filter(and_(Resource.domain_id == domain_id,
                                                        Resource.datasource_id == datasource_id,
                                                        Resource.resource_id == file_id)).all()
            print resource
            if resource is not None:
                for r in resource:
                    db_session.delete(r)

            resource_permission = db_session.query(ResourcePermission).filter(and_(ResourcePermission.domain_id == domain_id,
                                                   ResourcePermission.resource_id == file_id)).all()
            print resource_permission
            if resource_permission is not None:
                for rp in resource_permission:
                    db_session.delete(rp)

            db_session.commit()

        resource = Resource()
        resource.domain_id = domain_id
        resource.datasource_id = datasource_id
        resource.resource_id = file_id
        resource.resource_name = file_name
        resource.resource_type = file_type
        resource.resource_size = file_size
        resource.resource_owner_id = file_owner
        resource.last_modified_time = last_modified_time
        resource.creation_time = created_time
        resource.resource_parent_id = immediate_parent
        resource.exposure_type = constants.ResourceExposureType.PRIVATE

        db_session.add(resource)
        db_session.commit()

        # scan the permissions
        results = drive_service.permissions().list(fileId=file_id,
                                             fields="permissions(id, displayName, role, emailAddress)",
                                             ).execute()
        GetPermission(domain_id, datasource_id, '').update_permission_data_for_resource(file_id, results.get('permissions'))
        while results.get('nextPageToken') is not None:
            perms_page_token = results.get('nextPageToken')
            results = drive_service.permissions().list(fileId=file_id,
                                                 fields="permissions(displayName, role, emailAddress)",
                                                 pageToken=perms_page_token).execute()
            GetPermission(domain_id, datasource_id, '').update_permission_data_for_resource(file_id,
                                                                                            results.get('permissions'))


    except Exception as e:
        print "Exception occurred: ", e




