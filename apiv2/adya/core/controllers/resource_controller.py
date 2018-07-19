from sqlalchemy import and_, desc, or_
from sqlalchemy.orm import aliased

from adya.common.db.connection import db_connection
from adya.common.db import db_utils
from adya.common.db.models import Resource,ResourcePermission,LoginUser,DataSource,ResourcePermission,ResourceParent,Domain, DomainUser
from adya.common.constants import constants
from adya.common.utils import utils, aws_utils
from adya.common.utils.response_messages import ResponseMessage
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

def get_resources(auth_token, page_number, page_limit, accessible_by=None, exposure_type='EXT', resource_type='None', prefix='',
                  owner_email_id=None, parent_folder=None, selected_date=None, sort_column_name=None, sort_type=None, datasource_id=None, source_type=None):
    if not auth_token:
        return None
    
    db_session = db_connection().get_session()
    page_number = page_number if page_number else 0
    page_limit = page_limit if page_limit else constants.PAGE_LIMIT

    #Code moved to seperate common method fetch_filtered_resources
    resources_query, resource_alias, parent_alias = fetch_filtered_resources(db_session, auth_token, accessible_by, exposure_type, resource_type, prefix,
                  owner_email_id, parent_folder, selected_date, sort_column_name, sort_type, datasource_id, source_type)
    resources = resources_query.offset(page_number * page_limit).limit(page_limit).all()
    result = []
    for resource in resources:
        resource[0].parent_name = resource.resource_name
        result.append(resource[0])
    return result

def search_resources(auth_token, prefix):
    if not auth_token:
        return None
    if not prefix:
        return []
    db_session = db_connection().get_session()
    domain_datasource_ids = db_session.query(DataSource.datasource_id).filter(DataSource.domain_id == LoginUser.domain_id). \
        filter(LoginUser.auth_token == auth_token).all()
    domain_datasource_ids = [r for r, in domain_datasource_ids]
    resources = db_session.query(Resource).filter(and_(Resource.datasource_id.in_(domain_datasource_ids), Resource.resource_name.ilike("%" + prefix + "%"))).limit(10).all()

    return resources

def export_to_csv(auth_token, payload):
    #Extracting the fields from payload 
    source = payload["sourceType"]
    name = payload["resourceName"]
    type = payload["resourceType"]
    owner = payload["ownerEmailId"]
    exposure_type = payload["exposureType"]
    parent_folder = payload["parentFolder"]
    modified_date = payload["selectedDate"]
    selected_fields = payload['selectedFields']

    db_session = db_connection().get_session()
    existing_user = db_utils.get_user_session(auth_token)
    domain_id = existing_user.domain_id

    resources_query, resource_alias, parent_alias = fetch_filtered_resources(db_session, auth_token, exposure_type=exposure_type, resource_type=type, prefix=name,
        owner_email_id=owner, parent_folder=parent_folder, selected_date=modified_date, source_type=source)

    column_fields = []
    column_headers = []

    if 'source_type' in selected_fields:
        column_fields.append(DataSource.datasource_type)
        column_headers.append("Source")
    if 'resource_name' in selected_fields:
        column_fields.append(resource_alias.resource_name)
        column_headers.append("Name")
    if 'resource_type' in selected_fields:
        column_fields.append(resource_alias.resource_type)
        column_headers.append("Type")
    if 'resource_owner_id' in selected_fields:
        column_fields.append(resource_alias.resource_owner_id)
        column_headers.append("Owner")
    if 'exposure_type' in selected_fields:
        column_fields.append(resource_alias.exposure_type)
        column_headers.append("Exposure Type")
    if 'parent_name' in selected_fields:
        column_fields.append(parent_alias.resource_name)
        column_headers.append("Parent Folder")
    if 'last_modified_time' in selected_fields:
        column_fields.append(resource_alias.last_modified_time)
        column_headers.append("Modified On or Before")

    resources = resources_query.with_entities(*column_fields).filter(DataSource.datasource_id == resource_alias.datasource_id).all()

    temp_csv = utils.convert_data_to_csv(resources, column_headers)
    bucket_name = "adyaapp-" + constants.DEPLOYMENT_ENV + "-data"
    now = datetime.strftime(datetime.now(), "%Y-%m-%d-%H-%M-%S")
    #now = str(datetime.now())
    key = domain_id + "/export/resource-" + now
    temp_url = aws_utils.upload_file_in_s3_bucket(bucket_name, key, temp_csv)
    
    if temp_url:
        return ResponseMessage(202, None, temp_url)
    
    return ResponseMessage(400, "Failed to generate file. Please contact administrator")