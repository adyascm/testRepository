import json
import datetime
import uuid
from adya.common import utils, messaging
from threading import Thread
import time

from adya.common import constants,utils
from adya.db.connection import db_connection
from adya.db.models import DataSource, LoginUser, Domain, DirectoryStructure,\
                             DomainGroup,GroupAlias, DomainUser, ResourcePermission, Resource,ResourceParent
from adya.datasources.google import gutils


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
        if payload:
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
            db_session.query(GroupAlias).filter(GroupAlias.datasource_id == datasource_id).delete()
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
    messaging.trigger_get_event(constants.SCAN_DOMAIN_USERS,auth_token, query_params)
    messaging.trigger_get_event(constants.SCAN_DOMAIN_GROUPS, auth_token, query_params)
    if is_service_account_enabled == 'False':
        messaging.trigger_get_event(constants.SCAN_RESOURCES, auth_token, query_params)








