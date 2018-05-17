import json
import datetime
import uuid
import os
from sqlalchemy import String, Boolean, and_
import csv

from adya.common.utils.response_messages import Logger
from adya.common.utils import utils, messaging
from adya.common.constants import constants, urls
from adya.common.utils import utils
from adya.common.utils.response_messages import Logger
from adya.common.db.connection import db_connection
from adya.common.db.models import DataSource, LoginUser, Domain, DirectoryStructure, DomainGroup, \
    DomainUser, ResourcePermission, Resource, get_table, Policy, PolicyAction, PolicyCondition, \
    Application, Report, Action, AuditLog, PushNotificationsSubscription, ApplicationUserAssociation, Alert, \
    DatasourceCredentials
from adya.gsuite import gutils
from adya.slack import slack_utils


def get_datasource(auth_token, datasource_id, db_session=None):
    if not db_session:
        db_session = db_connection().get_session()
    if datasource_id:
        datasources = db_session.query(DataSource).filter(and_(
            DataSource.datasource_id == datasource_id, DataSource.is_async_delete == False)).first()
    else:
        datasources = db_session.query(DataSource).filter(and_(LoginUser.domain_id == DataSource.domain_id, DataSource.is_async_delete == False)).\
            filter(LoginUser.auth_token == auth_token).all()

    return datasources


def create_datasource(auth_token, payload):

    db_session = db_connection().get_session()

    existing_user = db_session.query(LoginUser).filter(
        LoginUser.auth_token == auth_token).first()

    datasource = None
    if existing_user:
        datasource_type = payload['datasource_type']
        if datasource_type == constants.ConnectorTypes.GSUITE:
            datasource = gutils.create_datasource(auth_token, db_session, existing_user, payload)
        elif datasource_type == constants.ConnectorTypes.SLACK:
            datasource = slack_utils.create_datasource(auth_token, db_session, existing_user, payload)


    return datasource


def async_delete_datasource(auth_token, datasource_id):
    db_session = db_connection().get_session()
    existing_datasource = db_session.query(DataSource).filter(
        DataSource.datasource_id == datasource_id).first()
    try:
        db_session.query(DirectoryStructure).filter(
            DirectoryStructure.datasource_id == datasource_id).delete(synchronize_session=False)
        db_session.query(DomainGroup).filter(
            DomainGroup.datasource_id == datasource_id).delete(synchronize_session=False)
        db_session.query(ResourcePermission).filter(
            ResourcePermission.datasource_id == datasource_id).delete(synchronize_session=False)
        db_session.query(Resource).filter(
            Resource.datasource_id == datasource_id).delete(synchronize_session=False)
        db_session.query(ApplicationUserAssociation).filter(
            ApplicationUserAssociation.datasource_id == datasource_id).delete(synchronize_session=False)
        db_session.query(Application).filter(
            Application.datasource_id == datasource_id).delete(synchronize_session=False)
        db_session.query(AuditLog).filter(
            AuditLog.datasource_id == datasource_id).delete(synchronize_session=False)
        db_session.query(PushNotificationsSubscription).filter(PushNotificationsSubscription.datasource_id ==
                                                               datasource_id).delete(synchronize_session=False)
        db_session.query(DomainUser).filter(
            DomainUser.datasource_id == datasource_id).delete(synchronize_session=False)
        db_session.query(Report).filter(Report.domain_id == existing_datasource.domain_id).delete(synchronize_session= False)
        # Delete Alert
        db_session.query(Alert).filter(Alert.datasource_id == datasource_id).delete(synchronize_session= False)
        #Delete Policies
        db_session.query(PolicyAction).filter(PolicyAction.datasource_id == existing_datasource.datasource_id).delete(synchronize_session= False)
        db_session.query(PolicyCondition).filter(PolicyCondition.datasource_id == existing_datasource.datasource_id).delete(synchronize_session= False)
        db_session.query(Policy).filter(Policy.datasource_id == existing_datasource.datasource_id).delete(synchronize_session= False)

        db_session.query(DatasourceCredentials).filter(DatasourceCredentials.datasource_id == existing_datasource.datasource_id).delete(synchronize_session= False)

        db_session.delete(existing_datasource)
        db_connection().commit()
        Logger().info("Datasource deleted successfully")
    except Exception as ex:
        Logger().exception("Exception occurred during datasource data delete - ")


def delete_datasource(auth_token, datasource_id):
    db_session = db_connection().get_session()
    existing_datasource = db_session.query(DataSource).filter(
        DataSource.datasource_id == datasource_id).first()
    domain_id = existing_datasource.domain_id
    if existing_datasource:
        db_session.query(DataSource).filter(
            DataSource.datasource_id == datasource_id).update({"is_async_delete": True})
        db_connection().commit()
        query_params = {"datasourceId": datasource_id}
        messaging.trigger_delete_event(
            urls.ASYNC_DELETE_DATASOURCE_PATH, auth_token, query_params)

        try:
            gutils.revoke_appaccess(
                auth_token, user_email=None, db_session=db_session)
        except Exception as ex:
            Logger().exception("Exception occurred while revoking the app access")


