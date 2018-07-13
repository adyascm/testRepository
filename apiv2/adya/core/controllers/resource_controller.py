from sqlalchemy import and_, desc, or_
from sqlalchemy.orm import aliased

from adya.common.db.connection import db_connection
from adya.common.db import db_utils
from adya.common.db.models import Resource,ResourcePermission,LoginUser,DataSource,ResourcePermission,ResourceParent,Domain, DomainUser
from adya.common.constants import constants
from boto3.s3.transfer import S3Transfer
from datetime import datetime
import csv, boto3, os, tempfile

current_file_path = os.path.dirname(os.path.realpath(__file__))
export_csv_dir = current_file_path + '/../../common/csv_exports'

def get_resources(auth_token, page_number, page_limit, accessible_by=None, exposure_type='EXT', resource_type='None', prefix='',
                  owner_email_id=None, parent_folder=None, selected_date=None, sort_column_name=None, sort_type=None, datasource_id=None, source_type=None):
    if not auth_token:
        return None
    page_number = page_number if page_number else 0
    page_limit = page_limit if page_limit else constants.PAGE_LIMIT

    db_session = db_connection().get_session()
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
    resources = []
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
    source = payload["Source"]
    name = payload["Name"]
    type = payload["Type"]
    owner = payload["Owner"]
    exposure_type = payload["Exposure Type"]
    parent_folder = payload["Parent Folder"]
    modified_date = payload["Modified On or Before"]

    db_session = db_connection().get_session()
    existing_user = db_utils.get_user_session(auth_token)
    domain_id = existing_user.domain_id
    datasource = db_session.query(DataSource).filter(DataSource.domain_id == domain_id).first()
    column_fields = []

    if name:
        column_fields.append(Resource.resource_name)
    if type:
        column_fields.append(Resource.resource_type)
    if owner:
        column_fields.append(Resource.resource_owner_id)
    if exposure_type:
        column_fields.append(Resource.exposure_type)
    if parent_folder:
        column_fields.append(Resource.parent_id)
    if modified_date:
        column_fields.append(Resource.last_modified_time)

    resources = db_session.query(Resource).filter(Resource.datasource_id == datasource.datasource_id).with_entities(*column_fields).all()
    print resources

    #Creating a tempfile for csv data
    with tempfile.NamedTemporaryFile() as temp_csv:
        csv_writer = csv.writer(temp_csv)
        csv_writer.writerows(resources)
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
        key = domain_id + "/export/resource-" + now
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


    
