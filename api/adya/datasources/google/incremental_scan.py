from adya.datasources.google import gutils
from adya.datasources.google.permission import GetPermission
from adya.db.connection import db_connection
from adya.db.models import PushNotificationsSubscription, Resource, ResourcePermission
from adya.controllers import domain_controller
from sqlalchemy import and_, update
from adya.common import constants
import requests
import json

import uuid

def subscribe(domain_id, auth_token):

    try:
        db_session = db_connection().get_session()
        existing_subscription = db_session.query(PushNotificationsSubscription).filter(and_(PushNotificationsSubscription.domain_id == domain_id,PushNotificationsSubscription.channel_id == auth_token)).first()
        if existing_subscription:
            return
        drive_service = gutils.get_gdrive_service(domain_id=domain_id)

        if drive_service:
            print "Got drive service!"

        root_file = drive_service.files().get(fileId='root').execute()
        print("Subscribe : Got Drive root ", root_file)
        root_file_id = root_file['id']

        channel_id = str(uuid.uuid4())

        if auth_token:
            channel_id = auth_token


        body = {
            "id": channel_id,
            "type": "web_hook",
            "address": constants.get_url_from_path(constants.PROCESS_GDRIVE_NOTIFICATIONS_PATH),
            "token": domain_id,
            "payload": "true",
            "params": {"ttl": 1800}

        }

        response = drive_service.files().watch(fileId=root_file_id, body=body).execute()
        print response

        response = drive_service.changes().getStartPageToken().execute()
        print 'Start token: %s' % response.get('startPageToken')
        page_token = response.get('startPageToken')

        push_notifications_subscription = PushNotificationsSubscription()

        push_notifications_subscription.domain_id = domain_id
        push_notifications_subscription.channel_id = channel_id
        push_notifications_subscription.page_token = page_token


        db_session.add(push_notifications_subscription)
        db_session.commit()
    except Exception as e:
        print "Exception occurred while requesting push notifications: ", e



def process_notifications(domain_id, channel_id):
    try:
        drive_service = gutils.get_gdrive_service(domain_id=domain_id)

        if drive_service:
            print "Got drive service!"

        datasource = domain_controller.get_datasource(channel_id, '')

        print datasource
        datasource_id = datasource[0].datasource_id

        if datasource_id:
            print "Got datasource_id: "

        db_session = db_connection().get_session()

        in_progress = db_session.query(PushNotificationsSubscription).filter(and_(PushNotificationsSubscription.channel_id == channel_id,
                                                               PushNotificationsSubscription.domain_id == domain_id)).first().in_progress

        if in_progress == 1:
            pns = db_session.query(PushNotificationsSubscription).filter(and_(PushNotificationsSubscription.channel_id == channel_id,
                                                               PushNotificationsSubscription.domain_id == domain_id)) \
                                                                .first()
            pns.stale = 1

            db_session.commit()

            return


        page_token = db_session.query(PushNotificationsSubscription).filter(and_(PushNotificationsSubscription.channel_id == channel_id,
                                                               PushNotificationsSubscription.domain_id == domain_id)).first().page_token

        while page_token is not None:
            response = drive_service.changes().list(pageToken=page_token,
                                              spaces='drive').execute()
            print response
            for change in response.get('changes'):
                # Process change
                fileId = change.get('fileId')
                print 'Change found for file: %s' % fileId
                print change

                handle_change(drive_service, domain_id, datasource_id, fileId)

            if 'newStartPageToken' in response:
                # Last page, save this token for the next polling interval
                saved_start_page_token = response.get('newStartPageToken')

                pns = db_session.query(PushNotificationsSubscription).filter(and_(PushNotificationsSubscription.channel_id == channel_id,
                    PushNotificationsSubscription.domain_id == domain_id)).first()
                pns.page_token = saved_start_page_token
                db_session.commit()

                page_token = response.get('nextPageToken')

        pns = db_session.query(PushNotificationsSubscription).filter(and_(PushNotificationsSubscription.channel_id == channel_id,
                                                               PushNotificationsSubscription.domain_id == domain_id)).first()
        pns.in_progress = 0
        db_session.commit()


        stale = db_session.query(PushNotificationsSubscription).filter(and_(PushNotificationsSubscription.channel_id == channel_id,
                                                        PushNotificationsSubscription.domain_id == domain_id)).first().stale

        if stale == 1:
            pns = db_session.query(PushNotificationsSubscription).filter(and_(PushNotificationsSubscription.channel_id == channel_id,
                                                        PushNotificationsSubscription.domain_id == domain_id)).first()
            pns.stale = 0
            db_session.commit()


            response = requests.get("https://dev-api.adya.io/notifications",
                                    headers={"X-Goog-Channel-Token": domain_id,
                                             "X-Goog-Channel-ID": channel_id})
            print response




    except Exception as e:
        print "Exception occurred: ", e


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




