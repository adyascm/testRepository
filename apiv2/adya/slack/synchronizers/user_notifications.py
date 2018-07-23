import json
from sqlalchemy import and_

from adya.common.constants import constants, urls
from adya.common.db import db_utils
from adya.common.db.activity_db import activity_db
from adya.common.db.connection import db_connection
from adya.common.db.db_utils import get_datasource_credentials
from adya.common.db.models import Resource, DataSource, DomainUser, ApplicationUserAssociation, Application, \
    alchemy_encoder
from adya.common.utils import messaging
from adya.common.utils.response_messages import Logger
from adya.common.utils.utils import get_trusted_entity_for_domain
from adya.slack import slack_utils, slack_constants
from adya.slack.mappers import entities
from adya.slack.scanners import apps_scanner


def process_activity(payload):
    user_info = payload['event']['user']
    team_id = user_info['team_id']

    db_session = db_connection().get_session()
    datasource = db_session.query(DataSource).filter(
        and_(DataSource.source_id == team_id, DataSource.datasource_type == constants.ConnectorTypes.SLACK.value)).first()
    if not datasource:
        return
    domain_id = datasource.domain_id
    datasource_id = datasource.datasource_id

    if user_info['is_bot']:
        #process for deleted and re installed apps
        process_app(db_session, domain_id, datasource_id, user_info)
    else:
        # user change event processing
        update_user(db_session, domain_id, datasource_id, user_info)
    db_connection().commit()


def update_user(db_session, domain_id, datasource_id, user_info):
    datasource_credentials = get_datasource_credentials(db_session, datasource_id)
    if datasource_credentials:
        domain_id = datasource_credentials['domain_id']
        slack_user = entities.SlackUser(domain_id, datasource_id, user_info)
        user_obj = slack_user.get_model()

        existing_user_info = db_session.query(DomainUser).\
            filter(and_(DomainUser.datasource_id == datasource_id, DomainUser.email == user_obj.email)).first()

        Logger().info("Existing user info - {} ".format(existing_user_info))
        Logger().info("updated user info - {}".format(user_obj))

        #update the existing user info
        db_session.query(DomainUser).filter(
            and_(DomainUser.datasource_id == datasource_id, DomainUser.email == user_obj.email)).update(
            db_utils.get_model_values(DomainUser, user_obj))

        #check for new admin creation
        if existing_user_info and (not existing_user_info.is_admin) and user_info.is_admin:
            payload = {}
            payload["user"] = json.dumps(user_obj, cls=alchemy_encoder())
            policy_params = {'dataSourceId': datasource_id,
                             'policy_trigger': constants.PolicyTriggerType.NEW_USER.value}
            Logger().info("new_user : payload : {}".format(payload))
            messaging.trigger_post_event(urls.SLACK_POLICIES_VALIDATE_PATH, constants.INTERNAL_SECRET, policy_params, payload,
                                         "slack")

        activity_db().add_event(domain_id=domain_id, connector_type=constants.ConnectorTypes.SLACK.value,
                                event_type='ROLE_CHANGED', actor=user_info.email,
                                tags={"is_admin":user_info.is_admin})


def process_app(db_session, domain_id, datasource_id, payload):
    slack_client = slack_utils.get_slack_client(datasource_id)
    app_id = payload["profile"]["api_app_id"]
    apps_logs = slack_client.api_call("team.integrationLogs",
                                      limit=150,
                                      app_id=app_id
                                      )
    app_name = None
    logs = None
    if apps_logs:
        logs = apps_logs['logs']
        for log_data in logs:
            app_name = log_data['app_type']
            if app_name:
                break

    if payload['deleted']:
            # app is deleted
            app_info = db_session.query(Application).filter(and_(Application.domain_id == domain_id, Application.display_text == app_name)).first()
            if app_info:
                db_session.query(ApplicationUserAssociation).filter(and_(ApplicationUserAssociation.datasource_id == datasource_id,
                                                                         ApplicationUserAssociation.application_id == app_info.id)).delete()
                db_connection().commit()

                db_session.delete(app_info)
            activity_db().add_event(domain_id=domain_id, connector_type=constants.ConnectorTypes.SLACK.value,
                                    event_type='OAUTH_REVOKE', actor=None,
                                    tags={"display_text":app_info.display_text})


    else:
        app_info = db_session.query(Application).filter(
            and_(Application.domain_id == domain_id, Application.display_text == app_name)).first()
        if not app_info:
            #reinstallation
            app_added_log_info = None
            for log_data in logs:
                if log_data['change_type'] == slack_constants.AppChangedTypes.ADDED.value:
                    app_added_log_info = log_data
                    break

            if app_added_log_info:
                query_params = {"dataSourceId": datasource_id}
                scanner_data = {"entities": [app_added_log_info]}
                # add in application and userappassociation table
                apps_scanner.process(db_session, None, query_params, scanner_data)
                user_id = app_added_log_info['user_id']
                display_text = app_added_log_info["app_type"] if "app_type" in app_added_log_info else app_added_log_info["service_type"]
                max_score = 0
                if 'scope' in app_added_log_info:
                    scopes = app_added_log_info["scope"]
                    max_score = slack_utils.get_app_score(scopes)

                #check for trusted apps
                check_app_is_trusted = False
                trusted_apps_list = (get_trusted_entity_for_domain(db_session, domain_id))['trusted_apps']
                if display_text in trusted_apps_list:
                        check_app_is_trusted = True

                #validate policy if apps are not trusted
                if not check_app_is_trusted:
                    policy_params = {'dataSourceId': datasource_id,
                                     'policy_trigger': constants.PolicyTriggerType.APP_INSTALL.value}

                    app_payload = {}
                    app_payload['display_text'] = display_text
                    app_payload['score'] = max_score
                    user_info = db_session.query(DomainUser).filter(
                        and_(DomainUser.datasource_id == datasource_id, DomainUser.user_id == user_id)).first()
                    app_payload['user_email'] = user_info.email

                    policy_payload = {}
                    policy_payload['application'] = json.dumps(app_payload, cls=alchemy_encoder())
                    Logger().info("added_app : payload : {}".format(app_payload))
                    messaging.trigger_post_event(urls.SLACK_POLICIES_VALIDATE_PATH, constants.INTERNAL_SECRET, policy_params,
                                                 policy_payload, "slack")

                activity_db().add_event(domain_id=domain_id, connector_type=constants.ConnectorTypes.SLACK.value,
                            event_type='OAUTH_GRANT', actor=user_id,
                            tags={"score":max_score, "display_text":display_text})












