from sqlalchemy import and_, desc, or_
from sqlalchemy.orm import aliased

from adya.common.db.connection import db_connection
from adya.common.db import db_utils, storage_db
from adya.common.db.models import Resource,ResourcePermission,LoginUser,DataSource,ResourcePermission,Domain, DomainUser
from adya.common.constants import constants, urls
from adya.common.utils import utils, aws_utils, messaging
from adya.common.utils.response_messages import ResponseMessage, Logger
from boto3.s3.transfer import S3Transfer
from datetime import datetime
import csv, boto3, os, tempfile


def fetch_filtered_resources(db_session, auth_token, accessible_by=None, exposure_type='EXT', resource_type='None', prefix='',
                  owner_email_id=None, parent_folder=None, selected_date=None, sort_column_name=None, sort_type=None, datasource_id=None, source_type=None):
    #db_session = db_connection().get_session()
    existing_user = db_utils.get_user_session(auth_token)
    user_domain_id = existing_user.domain_id
    loggged_in_user_email = existing_user.email
    is_admin = existing_user.is_admin
    domain_datasource_ids = []
    if datasource_id:
        domain_datasource_ids = [datasource_id]
    else:
        domain_datasource_ids = db_session.query(DataSource.datasource_id).filter(DataSource.domain_id == user_domain_id).all()
        domain_datasource_ids = [r for r, in domain_datasource_ids]
    # resources = []
    resource_alias = aliased(Resource)
    parent_alias = aliased(Resource)
    resources_query = db_session.query(resource_alias, parent_alias.resource_name).outerjoin(parent_alias, and_(resource_alias.parent_id == parent_alias.resource_id, resource_alias.datasource_id == parent_alias.datasource_id))

    if source_type:
        resources_query = resources_query.filter(resource_alias.datasource_id == source_type)
    if accessible_by and not owner_email_id:
        users_info = db_session.query(DomainUser).filter(and_(DomainUser.datasource_id.in_(domain_datasource_ids), DomainUser.email == accessible_by)).all()
        parent_ids = []
        for user in users_info:
            for group in user.groups:
                parent_ids.append(group.email)

        email_list = parent_ids + [accessible_by]
        resource_ids = db_session.query(ResourcePermission.resource_id).filter(and_(ResourcePermission.datasource_id.in_(domain_datasource_ids), ResourcePermission.email.in_(email_list)))
        resources_query = resources_query.filter(resource_alias.resource_id.in_(resource_ids))
        resources_query = resources_query.filter(resource_alias.resource_owner_id != accessible_by)
    if selected_date:
        resources_query = resources_query.filter(resource_alias.last_modified_time <= selected_date)
    if parent_folder:
        resources_query = resources_query.filter(parent_alias.resource_name == parent_folder)
    if owner_email_id:
        resources_query = resources_query.filter(resource_alias.resource_owner_id.ilike("%" + owner_email_id + "%"))
            
    if resource_type:
        resources_query = resources_query.filter(resource_alias.resource_type == resource_type)
    if exposure_type:
        resources_query = resources_query.filter(resource_alias.exposure_type == exposure_type)
    if prefix :
        resources_query = resources_query.filter(resource_alias.resource_name.ilike("%" + prefix + "%"))
    if not is_admin:
        resources_query = resources_query.filter(resource_alias.resource_owner_id == loggged_in_user_email)

    resources_query = resources_query.filter(resource_alias.datasource_id.in_(domain_datasource_ids))
    if not sort_column_name:
        sort_column_name = "last_modified_time"

    sort_column_obj = None
    if sort_column_name == "last_modified_time":
        sort_column_obj = resource_alias.last_modified_time
    elif sort_column_name == "resource_owner_id":
        sort_column_obj = resource_alias.resource_owner_id
    elif sort_column_name == "resource_name":
        sort_column_obj = resource_alias.resource_name
    elif sort_column_name == "exposure_type":
        sort_column_obj = resource_alias.exposure_type
    elif sort_column_name == "resource_type":
        sort_column_obj = resource_alias.resource_type
    elif sort_column_name == "datasource_id":
        sort_column_obj = resource_alias.datasource_id

    if sort_column_obj:
        if sort_type == "asc":
            sort_column_obj = sort_column_obj.asc()
        else:
            sort_column_obj = sort_column_obj.desc()
        resources_query = resources_query.order_by(sort_column_obj)
    
    return resources_query, resource_alias, parent_alias

def get_resources(auth_token, filters, page_number, page_limit, sort_column_name=None, sort_type=None):
    if not auth_token:
        return None
    
    login_user = db_utils.get_user_session(auth_token)
    
    page_number = page_number if page_number else 0
    page_limit = page_limit if page_limit else constants.PAGE_LIMIT
    sort_column_name = sort_column_name if sort_column_name else "last_modified_time"
    filters = filters if filters else {}

    if not login_user.is_admin:
        filters["resource_owner_id"] = login_user.email
    
    return storage_db.storage_db().get_resources(login_user.domain_id, filters, sort_column_name, sort_type, page_number, page_limit)

def export_to_csv(auth_token, payload):
    if not 'is_async' in payload:
        payload['is_async'] = True
        messaging.trigger_post_event(urls.RESOURCES_EXPORT, auth_token, None, payload)
        return ResponseMessage(202, "Your download request is in process, you shall receive an email with the download link soon...")
    else:
        write_to_csv(auth_token, payload)


def write_to_csv(auth_token, payload):
    if not auth_token:
        return None
    
    login_user = db_utils.get_user_session(auth_token)
    
    if not login_user.is_admin:
        payload["resource_owner_id"] = login_user.email
    
    resources = storage_db.storage_db().get_resources(login_user.domain_id, payload, None, None, 0, 100000, payload['selectedFields'])

    temp_csv = utils.convert_data_to_csv(resources, payload['selectedFields'])
    bucket_name = "adyaapp-" + constants.DEPLOYMENT_ENV + "-data"
    now = datetime.strftime(datetime.utcnow(), "%Y-%m-%d-%H-%M-%S")
    #now = str(datetime.utcnow())
    key = login_user.domain_id + "/export/resource-" + now + ".csv"
    temp_url = aws_utils.upload_file_in_s3_bucket(bucket_name, key, temp_csv)
    
    if temp_url:
        email_subject = "[Adya] Your download is ready"
        link = "<a href=" + temp_url + ">link</a>"
        email_head = "<p>Hi " + login_user.first_name + ",</p></br></br>"
        email_body = "<p>Your requested file is ready for download at this " + link + "</p></br></br>"
        email_signature = "<p>Best,</br> Team Adya</p>"
        rendered_html = email_head + email_body + email_signature
        aws_utils.send_email([login_user.email], email_subject, rendered_html)
        # adya_emails.send_csv_export_email(logged_in_user, domain_id, temp_url)
    else:
        Logger().exception("Failed to generate url. Please contact administrator")