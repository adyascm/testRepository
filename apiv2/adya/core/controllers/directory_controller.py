from sqlalchemy import and_, desc, asc
from adya.common.db.models import DirectoryStructure, LoginUser, DataSource, DomainUser, Application, \
    ApplicationUserAssociation, Resource, ResourcePermission, AppInventory
from adya.common.db.connection import db_connection
from adya.common.db import db_utils
from adya.common.utils import utils, aws_utils, messaging
from adya.common.constants import constants, urls
from datetime import datetime
import os, uuid, csv, tempfile, json, boto3
from adya.common.utils.response_messages import Logger, ResponseMessage
from boto3.s3.transfer import S3Transfer
from sqlalchemy import case

dir_path = os.path.dirname(os.path.realpath(__file__))

GOOGLE_API_SCOPES = json.load(open(dir_path + "/../../gsuite/google_api_scopes.json"))
SLACK_API_SCOPES = json.load(open(dir_path + "/../../slack/slack_api_scopes.json"))


def get_user_stats(auth_token):
    db_session = db_connection().get_session()
    login_user = db_utils.get_user_session(auth_token)
    user_domain_id = login_user.domain_id
    is_admin = login_user.is_admin
    is_service_account_is_enabled = login_user.is_serviceaccount_enabled

    datasources = db_session.query(DataSource).filter(
        DataSource.domain_id == user_domain_id).all()
    domain_datasource_ids = []
    datasources_map = {}
    source_stats = {}
    for ds in datasources:
        domain_datasource_ids.append(ds.datasource_id)
        datasources_map[ds.datasource_id] = ds
        source_stats[ds.datasource_type] = {"count": 0, "value": ds.datasource_id}
    users = db_session.query(DomainUser).filter(DomainUser.datasource_id.in_(domain_datasource_ids))

    shared_files_with_external_users =[]
    if is_service_account_is_enabled and not is_admin:
        shared_files_with_external_users = users.filter(and_(Resource.datasource_id == ResourcePermission.datasource_id,
                                                           Resource.resource_id == ResourcePermission.resource_id,
                                                           Resource.resource_owner_id == login_user.email,
                                                           ResourcePermission.datasource_id == DomainUser.datasource_id,
                                                           ResourcePermission.email == DomainUser.email,
                                                           DomainUser.member_type == constants.EntityExposureType.EXTERNAL.value)).all()

        users = users.filter(DomainUser.email == login_user.email)

    users = users.all() + shared_files_with_external_users
    domain_stats = {}
    admin_stats = {"Admin": {"count": 0, "value": 1}, "Non-Admin": {"count": 0, "value": 0}}
    exposure_stats = {"Internal": {"count": 0, "value": constants.EntityExposureType.INTERNAL.value},
                      "External": {"count": 0, "value": constants.EntityExposureType.EXTERNAL.value},
                      "Trusted": {"count": 0, "value": constants.EntityExposureType.TRUSTED.value}}
    type_stats = {}

    for user in users:
        domain_name = utils.get_domain_name_from_email(user.email)
        if domain_name:
            if domain_name in domain_stats:
                domain_stats[domain_name]["count"] = domain_stats[domain_name]["count"] + 1
            else:
                domain_stats[domain_name] = {"count": 1, "value": domain_name}
        ds = datasources_map[user.datasource_id]
        source_stats[ds.datasource_type]["count"] = source_stats[ds.datasource_type]["count"] + 1
        if user.is_admin == 1:
            admin_stats["Admin"]["count"] = admin_stats["Admin"]["count"] + 1
        else:
            admin_stats["Non-Admin"]["count"] = admin_stats["Non-Admin"]["count"] + 1

        if user.member_type == constants.EntityExposureType.INTERNAL.value:
            exposure_stats["Internal"]["count"] = exposure_stats["Internal"]["count"] + 1
        elif user.member_type == constants.EntityExposureType.EXTERNAL.value:
            exposure_stats["External"]["count"] = exposure_stats["External"]["count"] + 1
        elif user.member_type == constants.EntityExposureType.TRUSTED.value:
            exposure_stats["Trusted"]["count"] = exposure_stats["Trusted"]["count"] + 1

        if user.type in type_stats:
            type_stats[user.type]["count"] = type_stats[user.type]["count"] + 1
        else:
            type_stats[user.type] = {"count": 1, "value": user.type}
    stats = []
    stats.append({"display_name": "Access", "field_name": "member_type", "stats": exposure_stats})
    stats.append({"display_name": "Privileges", "field_name": "is_admin", "stats": admin_stats})
    stats.append({"display_name": "Type", "field_name": "type", "stats": type_stats})
    stats.append({"display_name": "Connectors", "field_name": "datasource_id", "stats": source_stats})
    stats.append({"display_name": "Domains", "field_name": "email", "stats": domain_stats})
    return stats


def get_users_list(auth_token, full_name=None, email=None, member_type=None, datasource_id=None, sort_column=None,
                   sort_order=None, is_admin=None, type=None, page_number=0):
    db_session = db_connection().get_session()
    login_user = db_utils.get_user_session(auth_token)
    user_domain_id = login_user.domain_id
    login_user_email = login_user.email
    is_login_user_admin = login_user.is_admin
    is_service_account_is_enabled = login_user.is_serviceaccount_enabled
    domain_datasource_ids = []
    if not datasource_id:
        datasources = db_session.query(DataSource).filter(
            DataSource.domain_id == user_domain_id).all()
        for ds in datasources:
            domain_datasource_ids.append(ds.datasource_id)
    else:
        domain_datasource_ids = [datasource_id]

    users_query = db_session.query(DomainUser).filter(DomainUser.datasource_id.in_(domain_datasource_ids))

    shared_files_with_external_users = []
    if is_service_account_is_enabled and not is_login_user_admin:
        shared_files_with_external_users = users_query.filter(and_(Resource.datasource_id == ResourcePermission.datasource_id,
                                                                   Resource.resource_owner_id == login_user_email,
                                                                   Resource.resource_id == ResourcePermission.resource_id,
                                                                   ResourcePermission.datasource_id == DomainUser.datasource_id,
                                                                   ResourcePermission.email == DomainUser.email,
                                                                   DomainUser.member_type == constants.EntityExposureType.EXTERNAL.value))

        shared_files_with_external_users = filter_on_get_user_list(shared_files_with_external_users, full_name, email,
                                            member_type, datasource_id, sort_column, sort_order, is_admin, type, page_number)

        shared_files_with_external_users = shared_files_with_external_users.all()

        users_query = users_query.filter(DomainUser.email == login_user_email)

    users_query = filter_on_get_user_list(users_query, full_name, email, member_type,
                            datasource_id, sort_column, sort_order, is_admin, type, page_number)
    users_list = users_query.all()
    return users_list + shared_files_with_external_users


def filter_on_get_user_list(entity, full_name=None, email=None, member_type=None, datasource_id=None, sort_column=None,
                   sort_order=None, is_admin=None, type=None, page_number=0):
    if full_name:
        entity = entity.filter(DomainUser.full_name.ilike("%" + full_name + "%"))
    if email:
        entity = entity.filter(DomainUser.email.ilike("%" + email + "%"))
    if is_admin:
        entity = entity.filter(DomainUser.is_admin == is_admin)
    if member_type:
        entity = entity.filter(DomainUser.member_type == member_type)
    if type:
        entity = entity.filter(DomainUser.type == type)

    sort_column_obj = None
    if sort_column == "datasource_id":
        sort_column_obj = DomainUser.datasource_id
    elif sort_column == "full_name":
        sort_column_obj = DomainUser.full_name
    elif sort_column == "email":
        sort_column_obj = DomainUser.email
    elif sort_column == "is_admin":
        sort_column_obj = DomainUser.is_admin
    elif sort_column == "member_type":
        sort_column_obj = DomainUser.member_type
    elif sort_column == "type":
        sort_column_obj = DomainUser.type
    elif sort_column == "last_login":
        sort_column_obj = DomainUser.last_login_time

    if sort_column_obj:
        if sort_order == "asc":
            sort_column_obj = sort_column_obj.asc()
        else:
            sort_column_obj = sort_column_obj.desc()
        entity = entity.order_by(sort_column_obj)


    if page_number:
        page_number = (int)(page_number)
        entity = entity.offset(page_number * 50).limit(50)

    return entity

def get_all_apps(auth_token):
    db_session = db_connection().get_session()
    datasources = db_session.query(DataSource).filter(DataSource.domain_id == LoginUser.domain_id).filter(
        LoginUser.auth_token == auth_token).all()
    domain_datasource_ids = [r.datasource_id for r in datasources]
    domain_user = db_session.query(DomainUser).filter(
        DataSource.domain_id == LoginUser.domain_id). \
        filter(and_(LoginUser.auth_token == auth_token, LoginUser.email == DomainUser.email,
                    DomainUser.datasource_id.in_(domain_datasource_ids))).first()

    is_admin = True
    if domain_user:
        is_admin = domain_user.is_admin
        login_user_email = domain_user.email

    apps_query_data = db_session.query(Application).filter(Application.domain_id == LoginUser.domain_id,
                                                           LoginUser.auth_token == auth_token)
    if not is_admin:
        apps_query_data = apps_query_data.filter(Application.id == ApplicationUserAssociation.application_id,
                                                 ApplicationUserAssociation.user_email == login_user_email)
        # verify
    apps_data = apps_query_data.order_by(desc(Application.score)).all()
    for app in apps_data:
        scopes = app.scopes
        if scopes:
            scope_list = scopes.split(",")
            descriptive_scope_list = []
            for scope in scope_list:
                if scope in GOOGLE_API_SCOPES:
                    descriptive_scope = GOOGLE_API_SCOPES[scope]['name']
                    descriptive_scope_list.append(descriptive_scope)
                elif scope in SLACK_API_SCOPES:
                    descriptive_scope = SLACK_API_SCOPES[scope]['name']
                    descriptive_scope_list.append(descriptive_scope)
            descriptive_scope_list = (",").join(descriptive_scope_list)
            app.scopes = descriptive_scope_list
    return apps_data


def get_users_for_app(auth_token, domain_id, app_id, sort_column_name, sort_order):
    db_session = db_connection().get_session()

    # check for non-admin user
    existing_user = db_utils.get_user_session(auth_token)
    is_admin = existing_user.is_admin
    is_service_account_is_enabled = existing_user.is_serviceaccount_enabled
    login_user_email = existing_user.email
    datasource_ids = db_session.query(DataSource.datasource_id).filter(DataSource.domain_id == domain_id).all()
    datasource_ids = [r for r, in datasource_ids]
    # if servie account and non-admin user, show permission for logged in user only
    if is_service_account_is_enabled and not is_admin:
        domain_user_emails = [[login_user_email]]
    else:
        domain_user_emails = db_session.query(ApplicationUserAssociation.user_email).filter(
            and_(ApplicationUserAssociation.application_id == app_id,
                 ApplicationUserAssociation.datasource_id.in_(datasource_ids)
                 )).all()

    domain_user_emails = [r for r, in domain_user_emails]
    apps_query = db_session.query(DomainUser).filter(and_(DomainUser.datasource_id.in_(datasource_ids), DomainUser.email.in_(domain_user_emails), DomainUser.member_type == constants.EntityExposureType.INTERNAL.value
    ))
    
    if sort_column_name == "last_login": 
        if sort_order == 'desc':
            apps_query = apps_query.order_by(DomainUser.last_login_time.desc())
        else:
            apps_query = apps_query.order_by(DomainUser.last_login_time.asc())  
    apps_query_data = apps_query.all()
    
    return apps_query_data


def get_apps_for_user(auth_token, datasource_id, user_email):
    db_session = db_connection().get_session()
    domain_applications = db_session.query(ApplicationUserAssociation.application_id).filter(
        and_(ApplicationUserAssociation.user_email == user_email,
             ApplicationUserAssociation.datasource_id == datasource_id)).all()
    domain_applications = [r for r, in domain_applications]
    user_apps = db_session.query(Application).filter(and_(Application.id.in_(domain_applications),
                                                          ApplicationUserAssociation.datasource_id == datasource_id)).order_by(
        desc(Application.score)).all()

    for app in user_apps:
        scope = app.scopes
        if scope:
            scope_list = scope.split(",")
            descriptive_scope_list = []
            for scope in scope_list:
                if scope in GOOGLE_API_SCOPES:
                    descriptive_scope = GOOGLE_API_SCOPES[scope]['name']
                    descriptive_scope_list.append(descriptive_scope)
                elif scope in SLACK_API_SCOPES:
                    descriptive_scope = SLACK_API_SCOPES[scope]['name']
                    descriptive_scope_list.append(descriptive_scope)
            descriptive_scope_list = (",").join(descriptive_scope_list)
            app.scopes = descriptive_scope_list
    return user_apps


def get_group_members(auth_token, group_email, datasource_id):
    db_session = db_connection().get_session()

    group_members = db_session.query(DomainUser). \
        filter(DomainUser.datasource_id == DirectoryStructure.datasource_id,
               DomainUser.email == DirectoryStructure.member_email). \
        filter(DirectoryStructure.datasource_id == datasource_id, DirectoryStructure.parent_email == group_email).all()

    return group_members


def update_apps(auth_token, payload):
    db_session = db_connection().get_session()
    existing_user = db_session.query(LoginUser).filter(LoginUser.auth_token == auth_token).first()
    if existing_user:
        app = {}
        app["unit_num"] = payload["unit_num"]
        app["unit_price"] = payload["unit_price"]
        app["pricing_model"] = payload["pricing_model"]
        app["category"] = payload["category"]
        db_session.query(Application).filter(Application.id == payload["application_id"]).update(app)
        db_connection().commit()
        return payload
    else:
        return None


def insert_apps(auth_token, payload):
    db_session = db_connection().get_session()
    existing_user = db_session.query(LoginUser).filter(LoginUser.auth_token == auth_token).first()
    domain_id = existing_user.domain_id
    if existing_user:
        app_ids = payload["app_ids"]
        for id in app_ids:
            app = Application()
            inventory_app = db_session.query(AppInventory).filter(AppInventory.id == id).first()
            app.domain_id = domain_id
            app.display_text = inventory_app.name
            app.inventory_app_id = id
            app.category = inventory_app.category
            app.image_url = inventory_app.image_url
            app.timestamp = str(datetime.utcnow().isoformat())
            app.unit_num = 0
            db_session.add(app)
        db_connection().commit()
        return payload
    else:
        return None

def export_to_csv(auth_token, payload):
    if not 'is_async' in payload:
        payload['is_async'] = True
        messaging.trigger_post_event(urls.USERS_EXPORT, auth_token, None, payload)
        return ResponseMessage(202, "Your download request is in process, you shall receive an email with the download link soon...")
    else:
        write_to_csv(auth_token, payload)

def write_to_csv(auth_token, payload):
    source = payload["datasource_id"]
    type = payload["type"]
    name = payload["full_name"]
    email = payload["email"]
    is_admin = payload["is_admin"]
    member_type = payload["member_type"]
    logged_in_user = payload["logged_in_user"]
    selected_fields = payload['selectedFields']

    db_session = db_connection().get_session()
    existing_user = db_utils.get_user_session(auth_token)
    domain_id = existing_user.domain_id

    datasources = db_session.query(DataSource).filter(DataSource.domain_id == domain_id).all()
    domain_datasource_ids = []
    for datasource in datasources:
        domain_datasource_ids.append(datasource.datasource_id)
    
    users_query = db_session.query(DomainUser).join(DataSource).filter(DomainUser.datasource_id.in_(domain_datasource_ids))
    users_query = filter_on_get_user_list(users_query, full_name=name, email=email, member_type=member_type, datasource_id=source,
                    is_admin=is_admin, type=type)

    column_fields = []
    column_headers = []

    if 'datasource_id' in selected_fields:
        column_fields.append(DataSource.datasource_type)
        column_headers.append('Source')
    if 'full_name' in selected_fields:
        column_name = case([(DomainUser.full_name != None, DomainUser.full_name),],
            else_ = DomainUser.first_name + " " + DomainUser.last_name)
        column_fields.append(column_name)
        column_headers.append('Name')
    if 'email' in selected_fields:
        column_fields.append(DomainUser.email)
        column_headers.append('Email')
    if '' in selected_fields:
        column_fields.append(DomainUser.photo_url)
        column_headers.append('Avatar')
    if 'type' in selected_fields:
        column_fields.append(DomainUser.type)
        column_headers.append('Type')
    if 'last_login' in selected_fields:
        column_fields.append(DomainUser.last_login_time)
        column_headers.append('Last Login')
    if 'is_admin' in selected_fields:
        column_fields.append(DomainUser.is_admin)
        column_headers.append('Is Admin')
    if 'member_type' in selected_fields:
        column_fields.append(DomainUser.member_type)
        column_headers.append('Exposure Type')
    
    users = users_query.with_entities(*column_fields).all()

    temp_csv = utils.convert_data_to_csv(users, column_headers)
    bucket_name = "adyaapp-" + constants.DEPLOYMENT_ENV + "-data"
    now = datetime.strftime(datetime.utcnow(), "%Y-%m-%d-%H-%M-%S")
    key = domain_id + "/export/user-" + now
    temp_url = aws_utils.upload_file_in_s3_bucket(bucket_name, key, temp_csv)

    if temp_url:
        email_subject = "[Adya] Your download is ready"
        link = "<a href=" + temp_url + ">Link</a>"
        email_head = "<h3>Hi " + existing_user.first_name + ",</h3></br></br>"
        email_body = "<h3>Your requested file is ready for download at this link - " + link + "</h3></br></br>"
        email_signature = "<h3>Best,</br> Team Adya</h3>"
        rendered_html = email_head + email_body + email_signature
        aws_utils.send_email([logged_in_user], email_subject, rendered_html)
    else:
        Logger().exception("Failed to generate url. Please contact administrator")