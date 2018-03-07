import json
import datetime
import uuid
from adya.common import utils, messaging
from threading import Thread
import time,os

from adya.common import constants,utils
from adya.db.connection import db_connection
from adya.db.models import DataSource, LoginUser, Domain, DirectoryStructure,DomainGroup,\
                     DomainUser, ResourcePermission, Resource,ResourceParent,get_table,\
                     Application,Report,Action,AuditLog,PushNotificationsSubscription
from adya.datasources.google import gutils
from sqlalchemy import String,Boolean,and_
import csv
def get_datasource(auth_token, datasource_id, db_session=None):
    if not db_session:
        db_session = db_connection().get_session()
    if datasource_id:
        datasources = db_session.query(DataSource).filter(and_(DataSource.datasource_id == datasource_id, DataSource.is_async_delete==False)).first()
    else:
        datasources = db_session.query(DataSource).filter(and_(LoginUser.domain_id == DataSource.domain_id,DataSource.is_async_delete==False)).\
        filter(LoginUser.auth_token == auth_token).all()
    
    return datasources


def update_datasource(db_session,datasource_id, column_name, column_value): 
    if column_name:
        datasources = db_session.query(DataSource).filter(DataSource.datasource_id == datasource_id). \
            update({column_name: column_name + column_value})
        db_session.commit()

        return datasources


def create_datasource(auth_token, payload):
    datasource_id = str(uuid.uuid4())
    db_session = db_connection().get_session()

    existing_user = db_session.query(LoginUser).filter(LoginUser.auth_token == auth_token).first()
    if existing_user:
        datasource = DataSource()
        datasource.domain_id = existing_user.domain_id
        datasource.datasource_id = datasource_id
        datasource.is_dummy_datasource = True if payload.get("isDummyDatasource") else False

        if payload.get("display_name"):
            datasource.display_name = payload["display_name"]
        else:
            datasource.display_name = "Unnamed datasource"
        # we are fixing the datasoure type this can be obtained from the frontend
        datasource.datasource_type = "GSUITE"
        datasource.creation_time = datetime.datetime.utcnow().isoformat()
        if datasource.is_dummy_datasource:
            datasource.is_serviceaccount_enabled = False
        else:
            datasource.is_serviceaccount_enabled = gutils.check_if_serviceaccount_enabled(existing_user.email)
        if not existing_user.is_admin_user:
            datasource.user_scan_status = 1
            datasource.group_scan_status = 1

        db_session.add(datasource)
        db_session.commit()
        if datasource.is_dummy_datasource:
            create_dummy_datasource(db_session,existing_user.domain_id,datasource_id)
        else:
            print "Starting the scan"
            query_params = {"isAdmin": str(existing_user.is_admin_user), "domainId": datasource.domain_id, "dataSourceId": datasource.datasource_id, "serviceAccountEnabled": str(datasource.is_serviceaccount_enabled)}
            messaging.trigger_post_event(constants.SCAN_START,auth_token, query_params, {})
            print "Received the response of start scan api"
        return datasource
    else:
        return None

def async_delete_datasource(auth_token, datasource_id):
    db_session = db_connection().get_session()
    existing_datasource = db_session.query(DataSource).filter(DataSource.datasource_id == datasource_id).first()
    try:
        db_session.query(DirectoryStructure).filter(DirectoryStructure.datasource_id == datasource_id).delete(synchronize_session=False)
        db_session.query(DomainGroup).filter(DomainGroup.datasource_id == datasource_id).delete(synchronize_session=False)
        db_session.query(ResourcePermission).filter(ResourcePermission.datasource_id == datasource_id).delete(synchronize_session=False)
        db_session.query(ResourceParent).filter(ResourceParent.datasource_id == datasource_id).delete(synchronize_session=False)
        db_session.query(Resource).filter(Resource.datasource_id == datasource_id).delete(synchronize_session=False)
        db_session.query(Application).filter(Application.datasource_id == datasource_id).delete(synchronize_session=False)
        db_session.query(AuditLog).filter(AuditLog.datasource_id == datasource_id).delete(synchronize_session=False)
        db_session.query(PushNotificationsSubscription).filter(PushNotificationsSubscription.datasource_id == datasource_id).delete(synchronize_session=False)
        db_session.query(DomainUser).filter(DomainUser.datasource_id == datasource_id).delete(synchronize_session=False)
        db_session.delete(existing_datasource)
        db_session.commit()
        print "Datasource deleted successfully"
    except Exception as ex:
        print "Exception occurred during datasource data delete - " + ex.message


def delete_datasource(auth_token, datasource_id):
    db_session = db_connection().get_session()
    existing_datasource = db_session.query(DataSource).filter(DataSource.datasource_id == datasource_id).first()
    domain_id = existing_datasource.domain_id
    if existing_datasource:
        db_session.query(DataSource).filter(DataSource.datasource_id == datasource_id).update({"is_async_delete":True})
        db_session.commit()
        query_params = {"datasourceId": datasource_id}
        messaging.trigger_delete_event(constants.ASYNC_DELETE_DATASOURCE_PATH,auth_token,query_params)
            
        try:
            gutils.revoke_appaccess(domain_id)
        except Exception as ex:
            print "Exception occurred while revoking the app access - " + ex.message

def create_domain(db_session,domain_id, domain_name):
    creation_time = datetime.datetime.utcnow().isoformat()

    domain = {}
    domain["domain_id"] = domain_id
    domain["domain_name"] = domain_name
    domain["creation_time"] = creation_time
    db_session.execute(Domain.__table__.insert().prefix_with("IGNORE").values([domain_id,domain_name,creation_time]))
    db_session.commit()
    return domain


def start_scan(auth_token, domain_id, datasource_id,is_admin,is_service_account_enabled):
    print "Received the request to start a scan for domain_id: {} datasource_id:{} is_admin:{} is_service_account_enabled: {}".format(domain_id, datasource_id,is_admin, is_service_account_enabled)
    query_params = {'domainId': domain_id, 'dataSourceId': datasource_id}
    if is_admin == 'True':
        messaging.trigger_get_event(constants.SCAN_DOMAIN_USERS,auth_token, query_params)
        messaging.trigger_get_event(constants.SCAN_DOMAIN_GROUPS, auth_token, query_params)
    if is_service_account_enabled == 'False' or not is_admin == 'True' :
        db_session = db_connection().get_session()
        existing_user = db_session.query(LoginUser).filter(LoginUser.auth_token ==auth_token).first()
        query_params["ownerEmail"] = existing_user.email
        messaging.trigger_get_event(constants.SCAN_RESOURCES, auth_token, query_params)

def create_dummy_datasource(db_session,domain_id,datasource_id):
    file_names = ['resource','user','group','directory_structure','resource_permission']
    for filename in file_names:
        results = []
        with open( gutils.dir_path + "/dummy_datasource/" + filename +".csv" ) as csvDataFile:
            csvReader = csv.reader(csvDataFile)
            tablename = get_table(filename)
            columns = tablename.__table__.columns
            firstrow = True
            for row in csvReader:
                if firstrow:
                    firstrow=False
                    continue
                datarow ={}
                for cellvalue, column in zip(row,columns) :
                    column_name = column.name
                    column_type = column.type
                    if cellvalue =='NULL':
                        datarow[column_name] =None
                    elif isinstance(column_type, Boolean):
                        if cellvalue =='0':
                            datarow[column_name] = False
                        else:
                            datarow[column_name] = True 
                    elif column_name=='domain_id':
                        datarow[column_name] = domain_id
                    elif column_name == 'datasource_id':
                        datarow[column_name] = datasource_id
                    else:
                        datarow[column_name] = cellvalue
                results.append(datarow)
        db_session.bulk_insert_mappings(tablename,results)
    db_session.commit()
    update_datasource_column_count(db_session,domain_id,datasource_id)

def update_datasource_column_count(db_session,domain_id,datasource_id):
    datasouorce = db_session.query(DataSource).filter(and_(DataSource.domain_id ==domain_id,DataSource.datasource_id == datasource_id)).first()
    filecount = db_session.query(Resource.resource_id).distinct(Resource.resource_id).\
                filter(and_(Resource.domain_id ==domain_id,Resource.datasource_id == datasource_id)).count()
    group_count = db_session.query(DomainGroup).distinct(DomainGroup.group_id).\
            filter(and_(DomainGroup.domain_id == domain_id,DomainGroup.datasource_id == datasource_id)).count()
    user_count = db_session.query(DomainUser).distinct(DomainUser.user_id).\
                filter(and_(DomainUser.domain_id == domain_id,DomainUser.datasource_id == datasource_id)).count()
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
    db_session.commit()








