import json
import datetime
import uuid
import os
from sqlalchemy import String, Boolean, and_
import csv

from adya.common.response_messages import Logger
from adya.common.utils import utils, messaging
from adya.common.constants import constants, urls
from adya.common.utils import utils
from adya.common.utils.response_messages import Logger
from adya.common.db.connection import db_connection
from adya.common.db.models import DataSource, LoginUser, Domain, DirectoryStructure, DomainGroup,\
    DomainUser, ResourcePermission, Resource, get_table,\
    Application, Report, Action, AuditLog, PushNotificationsSubscription, ApplicationUserAssociation
from adya.gsuite import gutils

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
    datasource_id = str(uuid.uuid4())
    db_session = db_connection().get_session()

    existing_user = db_session.query(LoginUser).filter(
        LoginUser.auth_token == auth_token).first()
    if existing_user:
        datasource = DataSource()
        datasource.domain_id = existing_user.domain_id
        datasource.datasource_id = datasource_id
        datasource.is_dummy_datasource = True if payload.get(
            "isDummyDatasource") else False

        if payload.get("display_name"):
            datasource.display_name = payload["display_name"]
        else:
            datasource.display_name = "Unnamed datasource"
        # we are fixing the datasoure type this can be obtained from the frontend
        datasource.datasource_type = "GSUITE"
        datasource.creation_time = datetime.datetime.utcnow()
        if datasource.is_dummy_datasource:
            datasource.is_serviceaccount_enabled = False
        else:
            datasource.is_serviceaccount_enabled = existing_user.is_serviceaccount_enabled

        is_admin_user = gutils.check_if_user_isamdin(
            auth_token, existing_user.email, db_session)

        #If service account is enabled, non admin cannot create a data source
        if(datasource.is_serviceaccount_enabled and not is_admin_user):
            raise Exception(
                "Action not allowed, please contact your administrator...")

        if not is_admin_user:
            datasource.user_scan_status = 1
            datasource.group_scan_status = 1

        if is_admin_user and not datasource.is_serviceaccount_enabled:
            #Since it is an admin user, update the domain name in domain table to strip off the full email
            domain_name = gutils.get_domain_name_from_email(existing_user.email)
            db_session.query(Domain).filter(Domain.domain_id == existing_user.domain_id).update({"domain_name": domain_name})

        db_session.add(datasource)
        db_connection().commit()
        if datasource.is_dummy_datasource:
            create_dummy_datasource(
                db_session, existing_user.domain_id, datasource_id)
        else:
            Logger().info("Starting the scan")
            query_params = {"isAdmin": str(is_admin_user), "domainId": datasource.domain_id,
                            "dataSourceId": datasource.datasource_id, "serviceAccountEnabled": str(datasource.is_serviceaccount_enabled)}
            messaging.trigger_post_event(urls.SCAN_START, auth_token, query_params, {}, "gsuite")
            print "Received the response of start scan api"
        return datasource
    else:
        return None


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


def create_dummy_datasource(db_session, domain_id, datasource_id):
    file_names = ['resource', 'user', 'group',
                  'directory_structure', 'resource_permission', 'application', 'app_user_association']
    for filename in file_names:
        results = []
        with open(gutils.dir_path + "/dummy_datasource/" + filename + ".csv") as csvDataFile:
            csvReader = csv.reader(csvDataFile)
            tablename = get_table(filename)
            columns = tablename.__table__.columns
            firstrow = True
            for row in csvReader:
                if firstrow:
                    firstrow = False
                    continue
                datarow = {}
                for cellvalue, column in zip(row, columns):
                    column_name = column.name
                    column_type = column.type
                    if cellvalue == 'NULL' or cellvalue == '':
                        datarow[column_name] = None
                    elif isinstance(column_type, Boolean):
                        if cellvalue == '0':
                            datarow[column_name] = False
                        else:
                            datarow[column_name] = True
                    elif column_name == 'domain_id':
                        datarow[column_name] = domain_id
                    elif column_name == 'datasource_id':
                        datarow[column_name] = datasource_id
                    else:
                        datarow[column_name] = cellvalue
                results.append(datarow)
        db_session.bulk_insert_mappings(tablename, results)
    db_connection().commit()
    update_datasource_column_count(db_session, domain_id, datasource_id)


def update_datasource_column_count(db_session, domain_id, datasource_id):
    datasouorce = db_session.query(DataSource).filter(DataSource.datasource_id == datasource_id).first()
    filecount = db_session.query(Resource.resource_id).distinct(Resource.resource_id).\
        filter(Resource.datasource_id == datasource_id).count()
    group_count = db_session.query(DomainGroup).distinct(DomainGroup.group_id).\
        filter(DomainGroup.datasource_id == datasource_id).count()
    user_count = db_session.query(DomainUser).distinct(DomainUser.user_id).\
        filter(DomainUser.datasource_id == datasource_id).count()
    datasouorce.total_file_count = filecount
    datasouorce.processed_file_count = filecount
    datasouorce.file_scan_status = user_count

    datasouorce.total_group_count = group_count
    datasouorce.processed_group_count = group_count
    datasouorce.group_scan_status = 1

    datasouorce.total_user_count = user_count
    datasouorce.processed_user_count = user_count
    datasouorce.user_scan_status = 1

    db_session.add(datasouorce)
    db_connection().commit()
