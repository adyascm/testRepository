import json

from adya.common.db import db_utils
from adya.common.db.connection import db_connection
from adya.common.db.db_utils import get_datasource, get_datasource_credentials
from adya.common.db.models import DataSource, Application, alchemy_encoder, DomainUser, TrustedEntities
from adya.common.utils import messaging
from adya.common.utils.response_messages import Logger
from adya.common.constants import constants, urls
from adya.common.utils.utils import get_trusted_entity_for_domain
from adya.slack import slack_utils, slack_constants
from sqlalchemy import and_
from adya.slack.mappers import entities
from adya.common.db.activity_db import ConnectorEvent
from adya.slack.scanners import apps_scanner


def process_activity(payload):
    team_id = payload["team_id"]
    db_session = db_connection().get_session()
    datasource = db_session.query(DataSource).filter(and_(DataSource.source_id == team_id,
                                                          DataSource.datasource_type == constants.ConnectorTypes.SLACK.value)).first()
    if not datasource:
        return
    event = payload['event']
    user_payload = event['user']
    if user_payload['is_bot']:
        process_application(db_session, datasource.datasource_id, user_payload)
    else:
        process_user(db_session, datasource, user_payload)


def process_user(db_session, datasource, payload):
    datasource_credentials = get_datasource_credentials(db_session, datasource.datasource_id)
    if datasource_credentials:
        domain_id = datasource_credentials['domain_id']
        userObj = entities.SlackUser(domain_id, datasource.datasource_id, payload)
        user_model_obj = userObj.get_model()
        db_session.execute(
            DomainUser.__table__.insert().prefix_with("IGNORE").values(db_utils.get_model_values(DomainUser, user_model_obj)))
        db_session.commit()

        #check if new external member is added to a team
        if user_model_obj.member_type == constants.EntityExposureType.EXTERNAL.value:
            payload = {}
            payload["user"] = json.dumps(user_model_obj, cls=alchemy_encoder())
            policy_params = {'dataSourceId': datasource.datasource_id,
                             'policy_trigger': constants.PolicyTriggerType.NEW_USER.value}
            Logger().info("new_user : payload : {}".format(payload))
            messaging.trigger_post_event(urls.SLACK_POLICIES_VALIDATE_PATH, "Internal-Secret", policy_params, payload,
                                         "slack")

        ConnectorEvent(domain_id=datasource.domain_id, datasource_id=datasource.datasource_id,
                       ds_type=constants.ConnectorTypes.SLACK.value,
                       event_type='USER_ADDED', actor=user_model_obj.email, event=json.dumps(payload))


def process_application(db_session, datasource_id, payload):
    slack_client = slack_utils.get_slack_client(datasource_id)
    app_id = payload['profile']['api_app_id']
    apps = slack_client.api_call("team.integrationLogs",
                                 limit=150,
                                 change_type=slack_constants.AppChangedTypes.ADDED.value,
                                 app_id=app_id
                                 )

    apps_list = apps["logs"]
    if apps_list:
        user_id = ''
        display_text = ''
        max_score = 0
        for app in apps_list:
            query_params = {"dataSourceId": datasource_id}
            scanner_data = {"entities": [app]}
            # add in application and userappassociation table
            apps_scanner.process(db_session, None, query_params, scanner_data)
            user_id = app['user_id']
            display_text = app["app_type"] if "app_type" in app else app["service_type"]
            if 'scope' in app:
                scopes = app["scope"]
                max_score = slack_utils.get_app_score(scopes)

        #check for trusted apps
        datasource_obj = get_datasource(datasource_id)
        domain_id = datasource_obj.domain_id
        check_app_is_trusted = False
        trusted_apps_list = (get_trusted_entity_for_domain(db_session, domain_id))['trusted_apps']
        if display_text in trusted_apps_list:
            check_app_is_trusted = True

        # policy check and send alert if apps are not trusted
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
            messaging.trigger_post_event(urls.SLACK_POLICIES_VALIDATE_PATH, "Internal-Secret", policy_params,
                                         policy_payload, "slack")
