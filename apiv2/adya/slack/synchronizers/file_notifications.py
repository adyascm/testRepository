import json

from sqlalchemy import and_

from adya.common.constants import constants, urls
from adya.common.db import db_utils
from adya.common.db.connection import db_connection
from adya.common.db.models import Resource, DataSource, ResourcePermission, alchemy_encoder, DomainUser
from adya.common.utils import messaging
from adya.common.utils.response_messages import Logger
from adya.slack import slack_utils
from adya.slack.mappers.entities import SlackFile


def process_activity(payload):
    team_id = payload["team_id"]
    db_session = db_connection().get_session()
    datasource = db_session.query(DataSource).filter(
        and_(DataSource.source_id == team_id,
             DataSource.datasource_type == constants.ConnectorTypes.SLACK.value)).first()
    if not datasource:
        return
    event = payload['event']
    process_file(db_session, datasource, event)


def process_file(db_session, datasource, payload):
    slack_client = slack_utils.get_slack_client(datasource.datasource_id)
    file_info = slack_client.api_call('files.info',
                                      file=payload["file_id"])
    file_data = file_info['file']
    resource_owner_id = file_data['user']
    resource_owner_info = db_session.query(DomainUser).filter(and_(DomainUser.datasource_id == datasource.datasource_id, DomainUser.user_id == resource_owner_id)).first()
    file_data['resource_owner_email'] = resource_owner_info.email
    update_resource(db_session, datasource.datasource_id, file_data)


def update_resource(db_session, datasource_id, updated_resource):
    slack_resource = SlackFile(datasource_id, updated_resource)
    db_resource = slack_resource.get_model()
    count = db_session.query(Resource).filter(and_(Resource.datasource_id == datasource_id, Resource.resource_id ==
                                                   db_resource.resource_id)).update(
        db_utils.get_model_values(Resource, db_resource))
    if count < 1:
        # insert new entry in resource table
        db_session.execute(
            Resource.__table__.insert().prefix_with("IGNORE").values(db_utils.get_model_values(Resource, db_resource)))

    # permissions map from update or newly shared resource entry.
    new_permissions_map = {}
    for new_permission in db_resource.permissions:
        new_permissions_map[new_permission.permission_id] = new_permission

    # Update resource permissions
    existing_permissions = db_session.query(ResourcePermission).filter(
        and_(ResourcePermission.datasource_id == datasource_id,
             ResourcePermission.resource_id == db_resource.resource_id)).all()

    existing_permissions_dump = json.dumps(existing_permissions, cls=alchemy_encoder())
    for existing_permission in existing_permissions:
        if existing_permission.permission_id in new_permissions_map:
            # Update the permission
            db_session.query(ResourcePermission).filter(
                and_(ResourcePermission.datasource_id == datasource_id, ResourcePermission.resource_id ==
                     db_resource.resource_id, ResourcePermission.permission_id == existing_permission.permission_id)) \
                .update(
                db_utils.get_model_values(ResourcePermission, new_permissions_map[existing_permission.permission_id]))

            new_permissions_map.pop(existing_permission.permission_id, None)
        else:
            # Delete the permission
            db_session.delete(existing_permission)

    # Now add all the other new permissions
    for new_permission in new_permissions_map.values():
        db_session.execute(ResourcePermission.__table__.insert().prefix_with("IGNORE").values(
            db_utils.get_model_values(ResourcePermission, new_permission)))

    db_connection().commit()
    # TODO : UPDATE THE DATA IN INFLUX DB

    # trigger policy
    payload = {}
    payload["old_permissions"] = existing_permissions_dump
    payload["resource"] = json.dumps(db_resource, cls=alchemy_encoder())
    payload["new_permissions"] = json.dumps(db_resource.permissions, cls=alchemy_encoder())
    policy_params = {'dataSourceId': datasource_id,
                     'policy_trigger': constants.PolicyTriggerType.PERMISSION_CHANGE.value}
    Logger().info("update_resource : payload : {}".format(payload))
    messaging.trigger_post_event(urls.SLACK_POLICIES_VALIDATE_PATH, constants.INTERNAL_SECRET, policy_params, payload, "slack")

