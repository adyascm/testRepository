import datetime, json, time

import requests
from sqlalchemy import and_

from adya.common.constants import urls, constants
from adya.common.db import db_utils
from adya.common.db.connection import db_connection
from adya.common.db.db_utils import get_datasource
from adya.common.db.models import DataSource, PushNotificationsSubscription, LoginUser, DataSource, Resource, ResourcePermission, \
    DomainUser, alchemy_encoder
from adya.common.utils import messaging
from adya.common.utils.response_messages import Logger
from adya.gsuite import gutils
from adya.gsuite.mappers.resource import GsuiteResource
from googleapiclient.errors import HttpError


def process_notifications(notification_type, datasource_id, channel_id):
    if notification_type == "sync":
        return

    now = datetime.datetime.utcnow()
    db_session = db_connection().get_session()
    in_progress_count = db_session.query(PushNotificationsSubscription).filter(and_(PushNotificationsSubscription.channel_id == channel_id, PushNotificationsSubscription.in_progress == 0)).update({"in_progress": 1, "last_accessed": now})
    db_connection().commit()

    if in_progress_count == 0:
        # Logger().warn("Either subscription does not exist or already in progress for datasource_id: {} and channel_id: {}, hence ignoring the notification.".format(
        #     datasource_id, channel_id))
        return

    subscription = db_session.query(PushNotificationsSubscription).filter(PushNotificationsSubscription.channel_id == channel_id).first()
    if not subscription or not subscription.page_token:
        # Logger().warn("Subscription does not exist or page token not set for datasource_id: {} and channel_id: {}, hence ignoring the notification.".format(
        #     datasource_id, channel_id))
        return

    user_email = subscription.user_email
    drive_service = None
    if not subscription.drive_root_id == "SVC":
        login_user = db_session.query(LoginUser).filter(LoginUser.email == subscription.user_email).first()
        drive_service = gutils.get_gdrive_service(login_user.auth_token, user_email, db_session)
    else:
        drive_service = gutils.get_gdrive_service(None, user_email, db_session)

    more_changes_to_process = False

    page_token = subscription.page_token
    drive_changes = []
    try:
        quotaUser = user_email[0:41]
        response = drive_service.changes().list(pageToken=page_token, restrictToMyDrive='true',
                                                spaces='drive', quotaUser=quotaUser, pageSize=10).execute()
        drive_changes = response.get('changes') if (response and 'changes' in response) else []
        Logger().info("Processing following change notification for user: {} with page token: {} = changes - {}".format(
            user_email, page_token, response))

        if 'nextPageToken' in response:
            # More changes available, so continue fetching changes with the updated page token
            more_changes_to_process = True
            page_token = response.get('nextPageToken')
        elif 'newStartPageToken' in response:
            # Last page, save this token for the next polling interval
            more_changes_to_process = False
            page_token = response.get('newStartPageToken')
    except HttpError as ex:
        if ex.resp.status == 401:
            Logger().warn("Invalid credentials error while trying to get changes for user: {}, datasource_id: {} channel_id: {} - {}".format(user_email, datasource_id, channel_id, ex))
        elif ex.resp.status == 403:
            #API limit reached, so retry after few seconds
            Logger().warn("API limit reached while trying to get changes for user: {}, datasource_id: {} channel_id: {} - {}".format(user_email, datasource_id, channel_id, ex))
            time.sleep(10)
            more_changes_to_process = True
        else:
            Logger().exception( "Exception occurred while trying to get changes for user: {}, datasource_id: {} channel_id: {} - {}".format(
                    user_email, datasource_id, channel_id, ex))
    except Exception as ex:
        Logger().exception("Exception occurred while trying to get changes for user: {}, datasource_id: {} channel_id: {} - {}".format(
                    user_email, datasource_id, channel_id, ex))
    # Process changes
    for change in drive_changes: 
        fileId = change.get('fileId')
        is_removed = change.get('removed')
        if is_removed:
            remove_file(db_session, datasource_id, fileId)
        else:
            handle_change(db_session, drive_service, datasource_id, user_email, fileId)

    in_progress_count = db_session.query(PushNotificationsSubscription).filter(and_(PushNotificationsSubscription.channel_id == channel_id)).update({"in_progress": 0, "page_token": page_token})
    db_connection().commit()
    if more_changes_to_process:
        headers={"X-Goog-Channel-Token": datasource_id, "X-Goog-Channel-ID": channel_id, 'X-Goog-Resource-State': notification_type}
        messaging.trigger_post_event_with_headers(urls.PROCESS_DRIVE_NOTIFICATIONS_PATH, constants.INTERNAL_SECRET, {}, headers, {}, "gsuite")

def remove_file(db_session, datasource_id, file_id):
    try:
        #Logger().info("Removing file from DB with id - {}".format(file_id))
        db_session.query(ResourcePermission).filter(and_(ResourcePermission.datasource_id == datasource_id,
                                                                ResourcePermission.resource_id == file_id)).delete()
        db_session.query(Resource).filter(and_(Resource.datasource_id == datasource_id, Resource.resource_id == file_id)).delete()
    except Exception as ex:
        Logger().exception("Exception occurred while trying to remove file datasource_id: {} file_id: {} - {}".format(
                    datasource_id, file_id, ex))

def handle_change(db_session, drive_service, datasource_id, email, file_id):
    try:
        quotaUser = email[0:41] #TODO: TEMP SOLUTION , NEED TO FIX THIS
        results = drive_service.files() \
            .get(fileId=file_id, fields="id, name, webContentLink, webViewLink, iconLink, "
                                        "thumbnailLink, description, lastModifyingUser, mimeType, parents, "
                                        "permissions(id, emailAddress, role, displayName, expirationTime, deleted),"
                                        "owners,size,createdTime, modifiedTime", quotaUser=quotaUser).execute()
        Logger().info("Updated resource for change notification is - {}".format(results))

        if results and results['owners'][0]['emailAddress'] != email:
            Logger().warn("Owner of the file is not same as subscribed user, hence ignoring. Owner email : {} and subscribed user email : {}".\
                format(results['owners'][0]['emailAddress'], email))
            return

        if results and not "permissions" in results:
            Logger().warn("Permissions not found for this resource, something wrong, hence ignoring. Owner email : {} and subscribed user email : {}".\
                format(results['owners'][0]['emailAddress'], email))
            return

        # resourcedata = {}
        # resourcedata["resources"] = [results]
        # datasource = db_session.query(DataSource).filter(DataSource.datasource_id == datasource_id).first()
        # query_params = {'domainId': datasource.domain_id, 'dataSourceId': datasource_id, 'ownerEmail': email,
        #                 'userEmail': email, 'is_incremental_scan': 1}
        # messaging.trigger_post_event(urls.SCAN_RESOURCES,  constants.INTERNAL_SECRET, query_params, resourcedata, "gsuite")
        update_resource(db_session, datasource_id, email, results)

    except HttpError as ex:
        if ex.resp.status == 401:
            Logger().info(
                "Invalid credentials error while processing the change notification for datasource_id: {} email: {} file_id: {} - {}".format(
                        datasource_id, email, file_id, ex))
        else:
            Logger().exception(
                "Exception occurred while processing the change notification for datasource_id: {} email: {} file_id: {} - {}".format(
                        datasource_id, email, file_id, ex))
    except Exception as ex:
        Logger().exception("Exception occurred while processing the change notification for datasource_id: {} email: {} file_id: {} - {}".format(
                        datasource_id, email, file_id, ex))

def update_resource(db_session, datasource_id, user_email, updated_resource):
    is_new_resource = 0
    gsuite_resource = GsuiteResource(datasource_id, updated_resource)
    db_resource = gsuite_resource.get_model()
    external_users = gsuite_resource.get_external_users()
    count = db_session.query(Resource).filter(and_(Resource.datasource_id == datasource_id, Resource.resource_id ==
        db_resource.resource_id)).update(db_utils.get_model_values(Resource, db_resource))
    if count < 1:
        #Resource does not exist, so insert
        is_new_resource = 1
        db_session.execute(Resource.__table__.insert().prefix_with("IGNORE").values(db_utils.get_model_values(Resource, db_resource)))

    new_permissions_map = {}
    for new_permission in db_resource.permissions:
        new_permissions_map[new_permission.permission_id] = new_permission

    #Update resource permissions
    existing_permissions = db_session.query(ResourcePermission).filter(and_(ResourcePermission.datasource_id == datasource_id,
        ResourcePermission.resource_id == db_resource.resource_id)).all()

    existing_permissions_dump = json.dumps(existing_permissions, cls=alchemy_encoder())
    existing_permissions_count = len(existing_permissions)
    for existing_permission in existing_permissions:
        if existing_permission.permission_id in new_permissions_map:
            #Update the permission
            db_session.query(ResourcePermission).filter(and_(ResourcePermission.datasource_id == datasource_id, ResourcePermission.resource_id ==
                db_resource.resource_id, ResourcePermission.permission_id == existing_permission.permission_id))\
                .update(db_utils.get_model_values(ResourcePermission, new_permissions_map[existing_permission.permission_id]))

            new_permissions_map.pop(existing_permission.permission_id, None)
        else:
            #Delete the permission
            db_session.delete(existing_permission)

    #Now add all the other new permissions
    for new_permission in new_permissions_map.values():
        event_name = ''
        db_session.execute(ResourcePermission.__table__.insert().prefix_with("IGNORE").values(db_utils.get_model_values(ResourcePermission, new_permission)))
        if new_permission.exposure_type == constants.EntityExposureType.PUBLIC.value:
            event_name = 'FILE_SHARE_PUBLIC'

        elif new_permission.exposure_type == constants.EntityExposureType.ANYONEWITHLINK.value:
            event_name = 'FILE_SHARE_ANYONEWITHLINK'

        elif new_permission.exposure_type == constants.EntityExposureType.EXTERNAL.value:
            event_name = 'FILE_SHARE_EXTERNAL'

    #Update external users
    if len(external_users)>0:
        external_users_values = []
        for external_user in external_users:
            external_users_values.append(db_utils.get_model_values(DomainUser, external_user))
        db_session.execute(DomainUser.__table__.insert().prefix_with("IGNORE").values(external_users_values))

    db_connection().commit()

    if is_new_resource == 1:
        db_session.query(DataSource).filter(DataSource.datasource_id == datasource_id). \
            update({DataSource.processed_file_count: DataSource.processed_file_count + 1, DataSource.total_file_count: DataSource.total_file_count + 1})

    messaging.send_push_notification("adya-"+datasource_id, 
            json.dumps({"type": "incremental_change", "datasource_id": datasource_id, "email": user_email, "resource": updated_resource}))

    new_permissions_count = len(db_resource.permissions)
    
    #If there are permissions to compare, then trigger policy validate
    if existing_permissions_count > 0 and new_permissions_count > 0:
        #Trigger the policy validation now
        payload = {}
        payload["old_permissions"] = existing_permissions_dump
        payload["resource"] = json.dumps(db_resource, cls=alchemy_encoder())
        payload["new_permissions"] = json.dumps(db_resource.permissions, cls=alchemy_encoder())
        policy_params = {'dataSourceId': datasource_id, 'policy_trigger': constants.PolicyTriggerType.PERMISSION_CHANGE.value}
        #Logger().info("update_resource : payload : {}".format(payload))
        messaging.trigger_post_event(urls.GSUITE_POLICIES_VALIDATE_PATH, constants.INTERNAL_SECRET, policy_params, payload, "gsuite")

