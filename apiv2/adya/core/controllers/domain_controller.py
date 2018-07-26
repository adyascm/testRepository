import json
import datetime
import uuid
import os
from sqlalchemy import String, Boolean, and_, not_
import csv

from adya.common.utils.response_messages import Logger
from adya.common.utils import utils, messaging
from adya.common.constants import constants, urls
from adya.common.db.connection import db_connection
from adya.common.db.models import DataSource, LoginUser, Domain, DirectoryStructure, \
    DomainUser, ResourcePermission, Resource, get_table, Policy, PolicyAction, PolicyCondition, \
    Application, Report, Action, AuditLog, PushNotificationsSubscription, ApplicationUserAssociation, TrustedEntities, \
    Alert, DatasourceCredentials, DatasourceScanners

from adya.gsuite import gutils, gsuite_constants


def get_datasource(auth_token, datasource_id=None, db_session=None):
    if not db_session:
        db_session = db_connection().get_session()
    if datasource_id:
        datasources = db_session.query(DataSource).filter(and_(
            DataSource.datasource_id == datasource_id, DataSource.is_async_delete == False)).first()
    else:
        datasources = db_session.query(DataSource).filter(
            and_(LoginUser.domain_id == DataSource.domain_id, DataSource.is_async_delete == False)). \
            filter(LoginUser.auth_token == auth_token).all()

    return datasources


def create_datasource(auth_token, payload):
    datasource_id = str(uuid.uuid4())
    db_session = db_connection().get_session()

    existing_user = db_session.query(LoginUser).filter(
        LoginUser.auth_token == auth_token).first()
    if existing_user:
        datasource = DataSource()
        datasource.is_push_notifications_enabled = 0
        datasource.domain_id = existing_user.domain_id
        datasource.datasource_id = datasource_id
        datasource.is_dummy_datasource = True if payload.get(
            "isDummyDatasource") else False

        #datasource.display_name = payload["display_name"]
        datasource.display_name = datasource.domain_id
        # we are fixing the datasoure type this can be obtained from the frontend
        datasource.datasource_type = "GSUITE"
        datasource.creation_time = datetime.datetime.utcnow()
        if datasource.is_dummy_datasource:
            datasource.is_serviceaccount_enabled = False
        else:
            datasource.is_serviceaccount_enabled = existing_user.is_serviceaccount_enabled

        admin_response = gutils.check_if_user_isadmin(
            auth_token, existing_user.email, db_session)
        is_admin_user = False

        #If service account is enabled, non admin cannot create a data source
        if(datasource.is_serviceaccount_enabled and admin_response):
            raise Exception(
                 admin_response + " Action not allowed.")
        if not admin_response:
            is_admin_user = True

        if not is_admin_user:
            datasource.user_scan_status = 1
            datasource.group_scan_status = 1

        if is_admin_user and not datasource.is_serviceaccount_enabled:
            # Since it is an admin user, update the domain name in domain table to strip off the full email
            domain_name = utils.get_domain_name_from_email(existing_user.email)
            db_session.query(Domain).filter(Domain.domain_id == existing_user.domain_id).update(
                {"domain_name": domain_name})

        db_session.add(datasource)
        db_connection().commit()
        if datasource.is_dummy_datasource:
            create_dummy_datasource(
                db_session, existing_user.domain_id, datasource_id)
        else:
            Logger().info("Starting the scan")
            query_params = { "domainId": datasource.domain_id,
                            "dataSourceId": datasource.datasource_id,
                            "userEmail": existing_user.email
                           }
            messaging.trigger_get_event(urls.SCAN_GSUITE_UPDATE, auth_token, query_params, "gsuite")
            
    
        return datasource
    else:
        return None


def async_delete_datasource(auth_token, datasource_id, complete_delete):
    complete_delete = 0 if complete_delete == 0 else 1
    db_session = db_connection().get_session()
    existing_datasource = db_session.query(DataSource).filter(
        DataSource.datasource_id == datasource_id).first()
    try:
        app_name = constants.datasource_to_installed_app_map[existing_datasource.datasource_type]
        db_session.execute(DirectoryStructure.__table__.delete().where(DirectoryStructure.datasource_id == datasource_id))
        db_session.execute(ResourcePermission.__table__.delete().where(ResourcePermission.datasource_id == datasource_id))
        db_session.execute(Resource.__table__.delete().where(Resource.datasource_id == datasource_id))
        app_query = db_session.query(ApplicationUserAssociation).filter(
            ApplicationUserAssociation.datasource_id == datasource_id)
        app_ids = [r.application_id for r in app_query.all()]
        app_query.delete(synchronize_session=False) 
        try:
            db_session.execute(Application.__table__.delete().where(Application.id.in_(app_ids)))
            # delete app wrt to datasource
            db_session.query(Application).filter(Application.display_text == app_name).delete(synchronize_session=False)
        except:
            Logger().info('App is present corresponding to other datasource')
        
        db_session.execute(PushNotificationsSubscription.__table__.delete().where(PushNotificationsSubscription.datasource_id == datasource_id))
        db_session.execute(DomainUser.__table__.delete().where(DomainUser.datasource_id == datasource_id))
        db_session.execute(DatasourceScanners.__table__.delete().where(DatasourceScanners.datasource_id == datasource_id))

        #If its not complete delete, then just clear out the scan entities, and reset the scan state 
        if complete_delete:
            db_session.execute(AuditLog.__table__.delete().where(AuditLog.datasource_id == datasource_id))
            db_session.execute(Alert.__table__.delete().where(Alert.datasource_id == datasource_id))
            db_session.execute(PolicyAction.__table__.delete().where(PolicyAction.datasource_id == datasource_id))
            db_session.execute(PolicyCondition.__table__.delete().where(PolicyCondition.datasource_id == datasource_id))
            db_session.execute(Policy.__table__.delete().where(Policy.datasource_id == datasource_id))
            db_session.execute(DatasourceCredentials.__table__.delete().where(DatasourceCredentials.datasource_id == datasource_id))
            db_session.delete(existing_datasource)
        else:
            existing_datasource.processed_file_count = 0
            existing_datasource.processed_group_count = 0
            existing_datasource.processed_user_count = 0
            existing_datasource.total_file_count = 0
            existing_datasource.total_group_count = 0
            existing_datasource.total_user_count = 0
            existing_datasource.file_scan_status = 0
            existing_datasource.group_scan_status = 0
            existing_datasource.user_scan_status = 0
            existing_datasource.is_push_notifications_enabled = 0
        db_connection().commit()
        Logger().info("Datasource deleted successfully")
    except:
        Logger().exception("Exception occurred during datasource data delete")


def delete_datasource(auth_token, datasource_id, complete_delete):
    complete_delete = 0 if complete_delete == 0 else 1
    db_session = db_connection().get_session()
    existing_datasource = db_session.query(DataSource).filter(
        DataSource.datasource_id == datasource_id).first()
    if existing_datasource:
        if complete_delete:
            db_session.query(DataSource).filter(DataSource.datasource_id == datasource_id).update({"is_async_delete": True})
            db_connection().commit()
        query_params = {"datasourceId": datasource_id, "completeDelete": complete_delete}
        messaging.trigger_delete_event(urls.ASYNC_DELETE_DATASOURCE_PATH, auth_token, query_params)

        #Revoke the token only when its an GSuite App
        if existing_datasource.datasource_type == constants.ConnectorTypes.GSUITE.value and complete_delete:
            try:
                gutils.revoke_appaccess(
                    auth_token, user_email=None, db_session=db_session)
            except:
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
    filecount = db_session.query(Resource.resource_id).distinct(Resource.resource_id). \
        filter(Resource.datasource_id == datasource_id).count()
    user_count = db_session.query(DomainUser).distinct(DomainUser.user_id). \
        filter(DomainUser.datasource_id == datasource_id).count()
    datasouorce.total_file_count = filecount
    datasouorce.processed_file_count = filecount
    datasouorce.file_scan_status = user_count

    datasouorce.total_group_count = 1
    datasouorce.processed_group_count = 1
    datasouorce.group_scan_status = 1

    datasouorce.total_user_count = user_count
    datasouorce.processed_user_count = user_count
    datasouorce.user_scan_status = 1

    db_session.add(datasouorce)
    db_connection().commit()


def create_trusted_entities_for_a_domain(auth_token, payload):
    db_session = db_connection().get_session()
    if payload:
        more_to_execute = False if not 'more_to_execute' in payload else payload['more_to_execute']
        existing_domains = []
        existing_apps = []
        datasource_ids = []
        if not more_to_execute:
            domain_id = payload['domain_id']
            new_domains = payload['trusted_domains']
            new_apps = payload['trusted_apps']
            datasources = get_datasource(auth_token)
            for datasource in datasources:
                datasource_ids.append(datasource.datasource_id)

            all_trusted_entities_for_domain = get_all_trusted_entities(domain_id)
            #Try to remove trusts which existed earlier and removed in the update
            if all_trusted_entities_for_domain:
                existing_domains = all_trusted_entities_for_domain['trusted_domains']
                existing_apps = all_trusted_entities_for_domain['trusted_apps']

                remove_domains = set(existing_domains) - set(new_domains)
                if len(remove_domains) > 0:
                    for domain_name in remove_domains:
                        more_to_execute, domain_name = delete_trusted_entities_for_domain(auth_token, domain_id, datasource_ids, domain_name, None)
                        if more_to_execute:
                            payload = {"more_to_execute": more_to_execute, "datasource_ids": datasource_ids,
                                       "remove_domain": domain_name}
                            messaging.trigger_post_event(urls.TRUSTED_ENTITIES, auth_token, None, payload)

                remove_apps = set(existing_apps) - set(new_apps)
                if len(remove_apps) > 0:
                    for apps_name in remove_apps:
                        delete_trusted_entities_for_domain(auth_token, domain_id, datasource_ids, None, apps_name)

            #Now add the new trusts
            add_domains = set(new_domains) - set(existing_domains)
            add_apps = set(new_apps) - set(existing_apps)

            if len(add_domains) > 0:
                for new_trusted_domain in add_domains:
                    more_to_execute, add_trusted_domain = update_data_for_trusted_domains(auth_token, db_session, datasource_ids, new_trusted_domain)
                    if more_to_execute:
                        payload = {"more_to_execute": more_to_execute, "datasource_ids": datasource_ids,
                                   "add_domain": add_trusted_domain}
                        messaging.trigger_post_event(urls.TRUSTED_ENTITIES, auth_token, None, payload)

            if len(add_apps) > 0:
                for apps_name in add_apps:
                    db_session.query(Application).filter(
                        and_(Application.domain_id == domain_id, Application.display_text == apps_name)) \
                        .update({Application.score: 0})

            trusted_domain_string = ",".join(str(x) for x in new_domains)
            trusted_app_string = ",".join(str(x) for x in new_apps)
            if all_trusted_entities_for_domain:
                db_session.query(TrustedEntities).filter(TrustedEntities.domain_id == domain_id).update({
                    TrustedEntities.trusted_domains: trusted_domain_string, TrustedEntities.trusted_apps: trusted_app_string
                })
                db_connection().commit()
                return payload
            else:
                # new entry
                db_entry = TrustedEntities()
                db_entry.domain_id = domain_id
                db_entry.trusted_domains = trusted_domain_string
                db_entry.trusted_apps = trusted_app_string

                try:
                    db_session.add(db_entry)
                except Exception as ex:
                    Logger().exception("error while inserting trusted entities in db - {}".format(ex))
                    db_session.rollback()
                    raise Exception(ex)
                db_connection().commit()
                return db_entry
        else:
            datasource_ids = payload['datasource_ids']
            if 'add_domain' in payload:
                more_to_execute, add_trusted_domain = update_data_for_trusted_domains(auth_token, db_session, datasource_ids, payload['add_domain'])
                if more_to_execute:
                    payload = {"more_to_execute": more_to_execute, "datasource_ids": datasource_ids, "add_domain": add_trusted_domain}
                    messaging.trigger_post_event(urls.TRUSTED_ENTITIES, auth_token, None, payload)

            elif 'remove_domain' in payload:
                more_to_execute, domain_name = delete_trusted_entities_for_domain(auth_token, payload['domain_id'], datasource_ids, payload['remove_domain'], None)
                if more_to_execute:
                    payload = {"more_to_execute": more_to_execute, "datasource_ids": datasource_ids, "remove_domain": domain_name}
                    messaging.trigger_post_event(urls.TRUSTED_ENTITIES, auth_token, None, payload)


def get_all_trusted_entities(domain_id):
    db_session = db_connection().get_session()

    trusted_entities_for_domain = db_session.query(TrustedEntities).filter(
        TrustedEntities.domain_id == domain_id).first()

    entities = {}

    if trusted_entities_for_domain != None:
        entities['trusted_domains'] = trusted_entities_for_domain.trusted_domains.split(',') if \
            (trusted_entities_for_domain.trusted_domains is not None and len(
                trusted_entities_for_domain.trusted_domains) > 0) else []
        entities['trusted_apps'] = trusted_entities_for_domain.trusted_apps.split(',') if \
            (trusted_entities_for_domain.trusted_apps is not None and len(
                trusted_entities_for_domain.trusted_apps) > 0) else []
    return entities

def delete_trusted_entities_for_domain(auth_token, domain_id, domain_datasource_ids, domain_name=None, app_name=None, first_call=True):
    db_session = db_connection().get_session()

    if domain_name:
        if first_call:
            db_session.query(DomainUser).filter(and_(DomainUser.datasource_id.in_(domain_datasource_ids),
                                                     DomainUser.member_type == constants.EntityExposureType.TRUSTED.value)). \
                filter(DomainUser.email.endswith("%{0}".format(domain_name))).update(
                {DomainUser.member_type: constants.EntityExposureType.EXTERNAL.value}
                , synchronize_session='fetch')

        resource_perms = db_session.query(ResourcePermission).filter(
            and_(ResourcePermission.datasource_id.in_(domain_datasource_ids),
                 ResourcePermission.exposure_type == constants.EntityExposureType.TRUSTED.value)). \
            filter(ResourcePermission.email.endswith("%{0}".format(domain_name))).limit(1000).all()

        more_to_execute = False
        if resource_perms:
            resource_ids = set()
            for perms in resource_perms:
                resource_ids.add(perms.resource_id)
                perms.exposure_type = constants.EntityExposureType.EXTERNAL.value

            db_session.query(Resource).filter(
                and_(Resource.datasource_id.in_(domain_datasource_ids), Resource.exposure_type ==
                     constants.EntityExposureType.TRUSTED.value)).filter(Resource.resource_id.in_(resource_ids)). \
                update({Resource.exposure_type: constants.EntityExposureType.EXTERNAL.value}, synchronize_session='fetch')

            if len(resource_perms) == 1000:
                more_to_execute = True

        return more_to_execute, domain_name

    elif app_name:
        apps_info = db_session.query(Application).filter(
            and_(Application.domain_id == domain_id, Application.display_text ==
                 app_name)).all()

        for apps in apps_info:
            app_scopes = apps.scopes.split(',')
            app_score = gutils.get_app_score(app_scopes)
            apps.score = app_score
    db_connection().commit()


def update_data_for_trusted_domains(auth_token, db_session, datasource_ids, new_trusted_domain, first_call=True):
    if first_call:
        # update the domain user table ; make the user as trusted if he belongs to given trusted domain
        db_session.query(DomainUser).filter(and_(DomainUser.datasource_id.in_(datasource_ids),
                                                 DomainUser.email.endswith("%{0}".format(new_trusted_domain)))). \
            update({DomainUser.member_type: constants.EntityExposureType.TRUSTED.value}
                   , synchronize_session='fetch')

    resource_perms = db_session.query(ResourcePermission).filter(
        and_(ResourcePermission.datasource_id.in_(datasource_ids),
             ResourcePermission.exposure_type == constants.EntityExposureType.EXTERNAL.value,
             ResourcePermission.email.endswith(
                 "%{0}".format(new_trusted_domain)))).limit(1000).all()

    more_to_execute = False
    if resource_perms:
        resource_ids = set()
        for perm in resource_perms:
            perm.exposure_type = constants.EntityExposureType.TRUSTED.value
            resource_ids.add(perm.resource_id)

        db_connection().commit()

        for resource_id in resource_ids:
            higher_permission_check = db_session.query(ResourcePermission).filter(
                and_(ResourcePermission.datasource_id.in_(datasource_ids),
                     ResourcePermission.resource_id == resource_id,
                     ResourcePermission.exposure_type == constants.EntityExposureType.EXTERNAL.value)).count()

            if higher_permission_check <= 0:
                db_session.query(Resource).filter(
                    and_(Resource.datasource_id.in_(datasource_ids), Resource.resource_id == resource_id,
                         Resource.exposure_type == constants.EntityExposureType.EXTERNAL.value)). \
                    update({Resource.exposure_type: constants.EntityExposureType.TRUSTED.value}, synchronize_session='fetch')

        db_connection().commit()
        if len(resource_perms) == 1000:
            more_to_execute = True

    return more_to_execute, new_trusted_domain

