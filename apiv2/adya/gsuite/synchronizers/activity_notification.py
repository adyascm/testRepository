import datetime
import json

from adya.common.constants import urls, constants
from adya.common.db import db_utils
from adya.common.db.activity_db import activity_db
from adya.common.db.connection import db_connection
from adya.common.db.db_utils import get_datasource
from adya.common.db.models import PushNotificationsSubscription, Resource, ResourcePermission, Application, \
    ApplicationUserAssociation, alchemy_encoder, AppInventory, DataSource, TrustedEntities, DirectoryStructure, Domain, \
    DomainUser
from adya.common.utils.response_messages import Logger
from adya.common.utils import messaging, utils
from adya.common.utils.utils import get_trusted_entity_for_domain
from adya.gsuite import gutils
from sqlalchemy.exc import IntegrityError
from sqlalchemy import and_
from google.auth.exceptions import RefreshError
from googleapiclient.errors import HttpError

from adya.gsuite.mappers import user
from adya.gsuite.scanners import users_scanner


def process_notifications(notification_type, datasource_id, channel_id, body):
    if notification_type == "sync":
        return

    db_session = db_connection().get_session()
    subscription = db_session.query(PushNotificationsSubscription).filter(
        PushNotificationsSubscription.channel_id == channel_id).first()
    if not subscription:
        Logger().warn("Subscription does not exist for datasource_id: {} and channel_id: {}, hence ignoring the notification.".format(
            datasource_id, channel_id))
        return

    activities = [body]
    try:
        # If notification type is adya, then that means its triggered either manually or scheduled sync
        # So we need to fetch the events from last sync time
        if notification_type == "adya":
            reports_service = gutils.get_gdrive_reports_service(None, subscription.user_email, db_session)
            results = reports_service.activities().list(userKey="all", applicationName=subscription.notification_type, startTime=subscription.page_token).execute()
            if results and "items" in results:
                activities = results["items"]

        for activity in activities:
            process_incoming_activity(datasource_id, activity)

        db_session.refresh(subscription)
        subscription.last_accessed = datetime.datetime.utcnow()
        subscription.page_token = datetime.datetime.utcnow().isoformat("T") + "Z"
        db_connection().commit()
    except Exception as e:
        Logger().exception("Exception occurred while processing activity notification for datasource_id: {} channel_id: {} - {}".format(datasource_id, channel_id, e))


def process_incoming_activity(datasource_id, incoming_activity):
    if not "id" in incoming_activity:
        Logger().info("Incoming activity is not valid type - {}".format(incoming_activity))
        return
    Logger().info("Incoming activity - {}".format(incoming_activity))
    app_name = incoming_activity["id"]["applicationName"]

    if app_name == "token":
        process_token_activity(datasource_id, incoming_activity)
    elif app_name == "admin":
        process_admin_activities(datasource_id, incoming_activity)
    elif app_name == 'login':
        process_login_activity(datasource_id, incoming_activity)
    # elif app_name == "drive":
    #     process_drive_activity(datasource_id, incoming_activity)


def process_token_activity(datasource_id, incoming_activity):
    Logger().info("Processing token activity - {}".format(incoming_activity))
    actor_email = incoming_activity['actor']['email']
    db_session = db_connection().get_session()
    for event in incoming_activity['events']:
        domain_id = db_session.query(DataSource).filter(DataSource.datasource_id == datasource_id).first().domain_id
        event_name = event['name']
        event_parameters = event['parameters']
        scopes = None
        client_id = None
        app_name = None
        for param in event_parameters:
            param_name = param["name"]
            if param_name == "app_name":
                app_name = param["value"]
            elif param_name == "client_id":
                client_id = param["value"]
            elif param_name == "scope":
                scopes = param["multiValue"]

        if not app_name:
            app_name = client_id

        application = db_session.query(Application).filter(Application.display_text == app_name,
                                                           Application.domain_id == domain_id).first()
        tags = {"display_text": app_name , "score": application.score}
        if event_name == "authorize":
            event_name = "OAUTH_GRANT"
            # Ignore Adya install
            if "Adya" in app_name:
                continue

            inventory_app = db_session.query(AppInventory).filter(AppInventory.name == app_name).first()
            inventory_app_id = inventory_app.id if inventory_app else None
            max_score = 0
            if not application:
                application = Application()
                application.anonymous = 1
                application.domain_id = domain_id
                application.timestamp = datetime.datetime.utcnow()
                if inventory_app_id:
                    application.inventory_app_id = inventory_app_id 
                    application.category = inventory_app.category
                    application.image_url = inventory_app.image_url

                # check for trusted apps
                trusted_domain_apps = (get_trusted_entity_for_domain(db_session, domain_id))["trusted_apps"]
                if scopes and not app_name in trusted_domain_apps:
                    max_score = gutils.get_app_score(scopes)

                application.score = max_score
                application.scopes = ','.join(scopes) if scopes else None
                if app_name:
                    application.display_text = app_name
                application.unit_num = 0
            user_association = ApplicationUserAssociation()
            user_association.user_email = actor_email
            user_association.datasource_id = datasource_id
            if client_id:
                user_association.client_id = client_id

            db_session = db_connection().get_session()
            db_session.add(application)
            try:
                db_connection().commit()
                user_association.application_id = application.id
                db_session.add(user_association)
                db_connection().commit()
                # Trigger the policy validation now
                payload = {}
                application.user_email = user_association.user_email

                if application.score != 0:
                    payload["application"] = json.dumps(application, cls=alchemy_encoder())
                    policy_params = {'dataSourceId': datasource_id, 'policy_trigger': constants.PolicyTriggerType.APP_INSTALL.value}
                    messaging.trigger_post_event(urls.GSUITE_POLICIES_VALIDATE_PATH, constants.INTERNAL_SECRET, policy_params, payload, "gsuite")

            except IntegrityError as ie:
                Logger().info("user app association was already present for the app : {} and user: {}".format(app_name, actor_email))
                db_session.rollback()

            tags["score"] = max_score

        elif event_name == "revoke":
            event_name = "OAUTH_REVOKE"
            if application:
                try:
                    app_id = application.id
                    db_session.query(ApplicationUserAssociation).filter(and_(ApplicationUserAssociation.application_id == app_id,
                             ApplicationUserAssociation.datasource_id == datasource_id)).delete()
                    db_session.delete(application)
                    db_connection().commit()
                except:
                    Logger().info("not able to delete app - {} from the db for user: {}".format(app_name, actor_email))
                    db_session.rollback()

        activity_db().add_event(domain_id=domain_id, connector_type=constants.ConnectorTypes.GSUITE.value,
                                event_type=event_name, actor=actor_email, tags=tags)


def process_drive_activity(datasource_id, incoming_activity):
    actor = incoming_activity['actor']
    # Sometimes email does not come, when the event is triggered by a service (Ex- Google Support for DLP)
    actor_email = actor['email'] if 'email' in actor else ""
    resource = {}
    resource_permission = {}
    last_modifying_user_email = actor_email
    last_modified_time = incoming_activity['id']['time'][:-1]
    for event in incoming_activity['events']:

        event_name = event['name']
        event_type = event['type']

        if event_type == 'acl_change':
            activity_events_parameters = event['parameters']
            primary_name = activity_events_parameters[0]['name']
            if primary_name == 'primary_event':
                boolValue = activity_events_parameters[0]['boolValue']
                if boolValue:
                    max_perm_string = None
                    for parameter in activity_events_parameters:
                        if parameter['name'] == 'doc_id':
                            resource["resource_id"] = parameter['value']
                            resource_permission["resource_id"] =parameter['value']
                        elif parameter['name'] == 'owner':
                            resource['resource_owner_id'] = parameter['value']
                        # permission change activity
                        elif parameter['name'] == 'target_user':
                            resource_permission['email'] = parameter['value']
                        elif parameter['name'] == 'new_value':
                            perm_values = parameter['multiValue'] # ['can_edit','can_view']
                            for perm in perm_values:
                                curr_perm_value = constants.permission_priority[perm] if perm in constants.permission_priority else 0
                                max_perm_Value = constants.permission_priority[max_perm_string] if max_perm_string in constants.permission_priority else 0
                                max_perm_string = perm if curr_perm_value > max_perm_Value else max_perm_string

                            resource_permission['permission_type'] = constants.Permission_Role_mapping[max_perm_string]
                        elif parameter['name'] == 'visibility':
                            resource_permission['exposure_type'] = parameter['value']


def process_admin_activities(datasource_id, incoming_activity):
    Logger().info("Processing admin activity - {}".format(incoming_activity))
    actor_email = incoming_activity['actor']['email']
    db_session = db_connection().get_session()
    for event in incoming_activity['events']:
        event_type = event['type']
        if event_type == 'GROUP_SETTINGS':
            process_group_related_activities(datasource_id, actor_email, event)
        elif event_type == 'USER_SETTINGS':
            process_user_related_activities(datasource_id, actor_email, event)


def process_group_related_activities(datasource_id, actor_email, event):
    event_name = event['name']
    if event_name == 'ADD_GROUP_MEMBER':
        activity_events_parameters = event['parameters']
        group_email = None
        user_email = None
        for param in activity_events_parameters:
            name = param['name']
            if name == 'GROUP_EMAIL':
                group_email = param['value']
            elif name == 'USER_EMAIL':
                user_email = param['value']

        user_directory_struct = DirectoryStructure()
        user_directory_struct.datasource_id = datasource_id
        user_directory_struct.member_email = user_email
        user_directory_struct.parent_email = group_email
        user_directory_struct.member_role = 'MEMBER'
        user_directory_struct.member_type = 'USER'  # TODO : check whether type is group or user

        db_session = db_connection().get_session()
        db_session.execute(DirectoryStructure.__table__.insert().prefix_with("IGNORE").
                           values(db_utils.get_model_values(DirectoryStructure, user_directory_struct)))

        if user_email:
            datasource_obj = get_datasource(datasource_id)
            domain_id = datasource_obj.domain_id
            exposure_type = utils.check_if_external_user(db_session, domain_id, user_email)
            if exposure_type == constants.EntityExposureType.EXTERNAL.value:
                # check if external user present in domain user table
                existing_user = db_session.query(DomainUser).filter(and_(DomainUser.datasource_id == datasource_id,
                                                                         DomainUser.email == user_email)).first()
                external_user = None
                if not existing_user:
                    external_user = DomainUser()
                    external_user.datasource_id = datasource_id
                    external_user.email = user_email
                    external_user.member_type = constants.EntityExposureType.EXTERNAL.value
                    external_user.type = 'USER'
                    # TODO: find the first name and last name of external user
                    external_user.first_name = ""
                    external_user.last_name = ""
                    db_session.add(external_user)

                user_obj = existing_user if existing_user else external_user
                payload = {}
                payload["user"] = json.dumps(user_obj, cls=alchemy_encoder())
                policy_params = {'dataSourceId': datasource_id,
                                 'policy_trigger': constants.PolicyTriggerType.NEW_USER.value}
                Logger().info("new_user : payload : {}".format(payload))
                messaging.trigger_post_event(urls.GSUITE_POLICIES_VALIDATE_PATH, constants.INTERNAL_SECRET, policy_params, payload,
                                             "gsuite")

        datasource_obj = get_datasource(datasource_id)
        tags = {"group_email": group_email, "user_email":user_email}
        activity_db().add_event(domain_id=datasource_obj.domain_id, connector_type=constants.ConnectorTypes.GSUITE.value,
                                event_type='ADD_GROUP_MEMBER', actor=actor_email, tags=tags)
        db_connection().commit()


def process_user_related_activities(datasource_id, actor_email, event):
    event_name = event['name']
    activity_events_parameters = event['parameters']
    user_email = None
    user_obj = None
    db_session = db_connection().get_session()
    for param in activity_events_parameters:
        name = param['name']
        if name == 'USER_EMAIL':
            user_email = param['value']

    datasource_obj = get_datasource(datasource_id)
    tags = {"user_email": user_email}
    if event_name == 'CREATE_USER':
        if user_email:
            directory_service = gutils.get_directory_service(None, actor_email)
            results = None
            try:
                results = directory_service.users().get(userKey=user_email).execute()
            except RefreshError as ex:
                Logger().info("User query : Not able to refresh credentials")
            except HttpError as ex:
                Logger().info("User query : Domain not found error")

            if results:
                gsuite_user = user.GsuiteUser(datasource_id, results)
                user_obj = gsuite_user.get_model()
                db_session.execute(DomainUser.__table__.insert().prefix_with("IGNORE").
                                   values(db_utils.get_model_values(DomainUser, user_obj)))

                call_validate_policies_for_admin_user(user_obj, datasource_id)

            additional_payload = {"user_email": user_email, "is_admin": user_obj.is_admin}
            tags["is_admin"] = user_obj.is_admin

    elif event_name == 'GRANT_ADMIN_PRIVILEGE':
        user_obj = db_session.query(DomainUser).filter(and_(DomainUser.datasource_id == datasource_id,
                                                            DomainUser.email == user_email)).first()
        if user_obj:
            user_obj.is_admin = True

        call_validate_policies_for_admin_user(user_obj, datasource_id)
        tags["is_admin"] = user_obj.is_admin

    elif event_name == "SUSPEND_USER":
       db_session.query(DomainUser).filter(and_(DomainUser.datasource_id == datasource_id,
                                                            DomainUser.email == user_email)).update({DomainUser.is_suspended: True})

    elif event_name == "DELETE_USER":
        delete_user_info(db_session, user_email, datasource_id)

    activity_db().add_event(domain_id=datasource_obj.domain_id,
                            connector_type=constants.ConnectorTypes.GSUITE.value,
                            event_type=event_name, actor=actor_email, tags=tags)
    db_connection().commit()


def call_validate_policies_for_admin_user(user_obj, datasource_id):
    if user_obj and user_obj.is_admin:
        payload = {}
        payload["user"] = json.dumps(user_obj, cls=alchemy_encoder())
        policy_params = {'dataSourceId': datasource_id,
                         'policy_trigger': constants.PolicyTriggerType.NEW_USER.value}
        Logger().info("new_user : payload : {}".format(payload))
        messaging.trigger_post_event(urls.GSUITE_POLICIES_VALIDATE_PATH, constants.INTERNAL_SECRET, policy_params,
                                     payload, "gsuite")


def process_login_activity(datasource_id, incoming_activity):
    Logger().info('Processing login activity {}'.format(incoming_activity))
    db_session = db_connection().get_session()
    actor_email = incoming_activity['actor']['email']
    events = incoming_activity["events"]
    login_time = datetime.datetime.strptime(incoming_activity["id"]["time"], '%Y-%m-%dT%H:%M:%S.%fZ')
    ninety_days_ago = datetime.datetime.utcnow() - datetime.timedelta(days=90)
    is_inactive = login_time < ninety_days_ago
    last_is_inactive = None
    for event in events:
        if event["name"] == 'login_success':
            last_login_time = db_session.query(DomainUser).filter(DomainUser.datasource_id == datasource_id, DomainUser.email == actor_email).first().last_login_time
            if last_login_time:
                last_is_inactive = last_login_time < ninety_days_ago
            if not last_login_time or (login_time > last_login_time):
                db_session.query(DomainUser).filter(DomainUser.datasource_id == datasource_id, DomainUser.email == actor_email).update({"last_login_time":login_time}, synchronize_session = 'fetch')
                datasource = db_session.query(DataSource).filter(DataSource.datasource_id == datasource_id).first()
                app_name = constants.datasource_to_installed_app_map[datasource.datasource_type]
                if (last_is_inactive is None) or not last_is_inactive :
                    if is_inactive:
                        db_session.query(Application).filter(and_(Application.domain_id == datasource.domain_id, Application.display_text == app_name)).update({"inactive_users":Application.inactive_users + 1}, synchronize_session = 'fetch')
                        Logger().info("new inactive user : {}".format(actor_email))
                elif last_is_inactive and not is_inactive:
                    Logger().info("inactive user is now active  : {}".format(actor_email))
                    db_session.query(Application).filter(and_(Application.domain_id == datasource.domain_id, Application.display_text == app_name, Application.inactive_users > 0)).update({"inactive_users":Application.inactive_users - 1}, synchronize_session = 'fetch')
    db_connection().commit()


def delete_user_info(db_session, user_email, datasource_id):
    #delete from resource and resource_permission table
    resources = db_session.query(Resource).filter(and_(Resource.datasource_id == datasource_id,
                                                       Resource.resource_owner_id == user_email)).all()
    for resource in resources:
        permissions = resource.permissions
        for perm in permissions:
            db_session.delete(perm)

        db_session.delete(resource)

    #delete user info from Domain user and directory struct tables
    db_session.query(DirectoryStructure).filter(and_(DirectoryStructure.datasource_id == datasource_id,
                                                     DirectoryStructure.member_email == user_email)).delete()

    db_session.query(DomainUser).filter(and_(DomainUser.datasource_id == datasource_id, DomainUser.email == user_email)).delete()



