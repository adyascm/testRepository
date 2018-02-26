import json
import datetime
import uuid
from adya.common import utils, messaging
from threading import Thread
import time,os

from adya.common import constants,utils
from adya.db.connection import db_connection
from adya.db.models import DataSource, LoginUser, Domain, DirectoryStructure,\
                             DomainGroup, DomainUser, ResourcePermission, Resource,ResourceParent,get_table
from adya.datasources.google import gutils
from sqlalchemy import String,Boolean,and_

def get_datasource(auth_token, datasource_id, db_session=None):
    if not db_session:
        db_session = db_connection().get_session()
    if datasource_id:
        datasources = db_session.query(DataSource).filter(DataSource.datasource_id == datasource_id).first()
    else:
        datasources = db_session.query(DataSource).filter(LoginUser.domain_id == DataSource.domain_id). \
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
            datasource.display_name = "test"
        # we are fixing the datasoure type this can be obtained from the frontend
        datasource.datasource_type = "GSUITE"
        datasource.creation_time = datetime.datetime.utcnow().isoformat()
        datasource.is_serviceaccount_enabled = gutils.check_if_serviceaccount_enabled(existing_user.email)
        db_session.add(datasource)
        
        try:
            db_session.commit()
        except Exception as ex:
            print (ex)
        print "Starting the scan"
        #thread = Thread(target = start_scan, args = (auth_token,datasource.domain_id, datasource.datasource_id,datasource.is_serviceaccount_enabled))
        #thread.start()
        if datasource.is_dummy_datasource:
            create_dummy_datasource(db_session,existing_user.domain_id,datasource_id)
        else:
            query_params = {"domainId": datasource.domain_id, "dataSourceId": datasource.datasource_id, "serviceAccountEnabled": str(datasource.is_serviceaccount_enabled)}
            messaging.trigger_post_event(constants.SCAN_START,auth_token, query_params, {})

        print "Received the response of start scan api"
        #start_scan(auth_token,datasource.domain_id, datasource.datasource_id,existing_user.email)
        return datasource
    else:
        return None

def delete_datasource(auth_token, datasource_id):
    db_session = db_connection().get_session()

    existing_datasource = db_session.query(DataSource).filter(DataSource.datasource_id == datasource_id).first()
    domain_id = existing_datasource.domain_id
    if existing_datasource:
        try:
            db_session.query(DirectoryStructure).filter(DirectoryStructure.datasource_id == datasource_id).delete()
            db_session.query(DomainGroup).filter(DomainGroup.datasource_id == datasource_id).delete()
            db_session.query(ResourcePermission).filter(ResourcePermission.datasource_id == datasource_id).delete()
            db_session.query(ResourceParent).filter(ResourceParent.datasource_id == datasource_id).delete()
            db_session.query(Resource).filter(Resource.datasource_id == datasource_id).delete()
            db_session.query(DomainUser).filter(DomainUser.datasource_id == datasource_id).delete()
            db_session.delete(existing_datasource)
            db_session.commit()
        except Exception as ex:
            print "Exception occurred during datasource data delete - " + ex
        
        try:
            gutils.revoke_appaccess(domain_id)
        except Exception as ex:
            print "Exception occurred while revoking the app access - " + ex
    else:
        return None


def create_domain(domain_id, domain_name):
    db_session = db_connection().get_session()
    creation_time = datetime.datetime.utcnow().isoformat()

    domain = Domain()
    domain.domain_id = domain_id
    domain.domain_name = domain_name
    domain.creation_time = creation_time
    db_session.add(domain)
    db_session.commit()
    return domain


def start_scan(auth_token, domain_id, datasource_id,is_service_account_enabled):
    print "Received the request to start a scan for domain_id: {} datasource_id:{} is_service_account_enabled: {}".format(domain_id, datasource_id, is_service_account_enabled)
    query_params = {'domainId': domain_id, 'dataSourceId': datasource_id}

    if constants.DEPLOYMENT_ENV != "local":
        print "Trying for push notification subscription for domain_id: {} datasource_id: {}".format(domain_id, datasource_id)
        messaging.trigger_post_event(constants.SUBSCRIBE_GDRIVE_NOTIFICATIONS_PATH,auth_token, query_params, {})

    messaging.trigger_get_event(constants.SCAN_DOMAIN_USERS,auth_token, query_params)
    messaging.trigger_get_event(constants.SCAN_DOMAIN_GROUPS, auth_token, query_params)
    if is_service_account_enabled == 'False':
        messaging.trigger_get_event(constants.SCAN_RESOURCES, auth_token, query_params)

def create_dummy_datasource(db_session,domain_id,datasource_id):
    try:
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
    except Exception as ex:
        print(ex)
def update_datasource_column_count(db_session,domain_id,datasource_id):
    datasouorce = db_session.query(DataSource).filter(and_(DataSource.domain_id ==domain_id,DataSource.datasource_id == datasource_id)).first()
    filecount = db_session.query(Resource.resource_id).distinct(Resource.resource_id).\
                filter(and_(Resource.domain_id ==domain_id,Resource.datasource_id == datasource_id)).count()
    datasouorce.total_file_count = filecount
    datasouorce.processed_file_count = filecount
    datasouorce.file_scan_status = 2
    group_count = db_session.query(DomainGroup).distinct(DomainGroup.group_id).\
                filter(and_(DomainGroup.domain_id == domain_id,DomainGroup.datasource_id == datasource_id)).count()
    datasouorce.total_group_count = group_count
    datasouorce.processed_group_count = group_count
    datasouorce.group_scan_status = 1
    user_count = db_session.query(DomainUser).distinct(DomainUser.user_id).\
                filter(and_(DomainUser.domain_id == domain_id,DomainUser.datasource_id == datasource_id)).count()
    datasouorce.total_user_count = user_count
    datasouorce.processed_user_count = user_count
    datasouorce.user_scan_status = 1

    db_session.add(datasouorce)
    db_session.commit()








