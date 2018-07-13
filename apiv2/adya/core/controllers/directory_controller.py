from sqlalchemy import and_, desc, asc
from adya.common.db.models import DirectoryStructure, LoginUser, DataSource, DomainUser, Application, \
    ApplicationUserAssociation, Resource, ResourcePermission, AppInventory
from adya.common.db.connection import db_connection
from adya.common.db import db_utils
from adya.common.utils import utils
from adya.common.constants import constants
from datetime import datetime
import os, uuid, csv, tempfile, json, boto3
from adya.common.utils.response_messages import Logger
from boto3.s3.transfer import S3Transfer

dir_path = os.path.dirname(os.path.realpath(__file__))

GOOGLE_API_SCOPES = json.load(open(dir_path + "/../../gsuite/google_api_scopes.json"))
SLACK_API_SCOPES = json.load(open(dir_path + "/../../slack/slack_api_scopes.json"))

export_csv_dir = dir_path + '/../../common/csv_exports'

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
        shared_files_with_external_users = users.filter(and_(Resource.resource_owner_id == login_user.email,
                                                                   ResourcePermission.resource_id == Resource.resource_id,
                                                                   DomainUser.email == ResourcePermission.email,
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

    users_query = db_session.query(DomainUser)

    if not datasource_id:
        datasources = db_session.query(DataSource).filter(
            DataSource.domain_id == user_domain_id).all()
        domain_datasource_ids = []
        for ds in datasources:
            domain_datasource_ids.append(ds.datasource_id)
        users_query = users_query.filter(DomainUser.datasource_id.in_(domain_datasource_ids))

    shared_files_with_external_users = []
    if is_service_account_is_enabled and not is_login_user_admin:
        shared_files_with_external_users = users_query.filter(and_(Resource.resource_owner_id == login_user_email,
                                                                   ResourcePermission.resource_id == Resource.resource_id,
                                                                   DomainUser.email == ResourcePermission.email,
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
    if datasource_id:
        entity = entity.filter(DomainUser.datasource_id == datasource_id)
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


def get_users_for_app(auth_token, domain_id, app_id):
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

    apps_query_data = db_session.query(DomainUser).filter(and_(DomainUser.datasource_id.in_(datasource_ids), DomainUser.email.in_(domain_user_emails), DomainUser.member_type == constants.EntityExposureType.INTERNAL.value
    )).all()

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
            app.timestamp = str(datetime.utcnow().isoformat())
            app.unit_num = 0
            db_session.add(app)
        db_connection().commit()
        return payload
    else:
        return None

def export_to_csv(auth_token, payload):
    source = payload["Source"]
    type = payload["Type"]
    name = payload["Name"]
    email = payload["Email"]
    is_admin = payload["Is Admin"]
    exposure_type = payload["Exposure Type"]

    db_session = db_connection().get_session()
    existing_user = db_utils.get_user_session(auth_token)
    domain_id = existing_user.domain_id

    datasource = db_session.query(DataSource).filter(DataSource.domain_id == domain_id).first()
    column_fields = []

    if name:
        column_fields.append(DomainUser.full_name)
    if type:
        column_fields.append(DomainUser.type)
    if email:
        column_fields.append(DomainUser.email)
    if is_admin:
        column_fields.append(DomainUser.is_admin)
    if exposure_type:
        column_fields.append(DomainUser.member_type)

    users = db_session.query(DomainUser).filter(DataSource.datasource_id == datasource.datasource_id).with_entities(*column_fields).all()

    #Creating a tempfile for csv data
    with tempfile.NamedTemporaryFile() as temp_csv:
        csv_writer = csv.writer(temp_csv)
        csv_writer.writerows(users)
        temp_csv.seek(0)

        #Reading the tempfile created
        csv_reader = csv.reader(temp_csv)
        for row in csv_reader:
            print row
        #temp_csv.close()

        #Uploading the file in s3 bucket
        client = boto3.client('s3', aws_access_key_id=constants.ACCESS_KEY_ID, aws_secret_access_key=constants.SECRET_ACCESS_KEY)
        bucket_name = "adyaapp-" + constants.DEPLOYMENT_ENV + "-data"
        bucket_obj = None
        try:
            bucket_obj = client.create_bucket(
                Bucket=bucket_name,
                CreateBucketConfiguration={
                    'LocationConstraint': 'ap-south-1'
                })
            print bucket_obj
        
        except Exception as ex:
            print ex
            err_response = ex.response
            if err_response['Error']['Code'] == "BucketAlreadyOwnedByYou":
                print "Bucket already created!!"
        
        transfer = S3Transfer(client)
        now = datetime.strftime(datetime.now(), "%Y-%m-%d-%H-%M-%S")
        #now = str(datetime.now())
        key = domain_id + "/export/user-" + now
        transfer.upload_file(temp_csv.name, bucket_name, key)
        
        #Constructing a temporary file url 
        temp_url = client.generate_presigned_url(
            'get_object', 
            Params = {
                'Bucket': bucket_name,
                'Key': key,
            },
            ExpiresIn=60)
        print temp_url
        return temp_url

    