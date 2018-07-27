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

def get_resources(auth_token, filters, page_number, page_limit, sort_column=None, sort_type=None):
    if not auth_token:
        return None
    
    login_user = db_utils.get_user_session(auth_token)
    
    page_number = int(page_number) if page_number else 0
    page_limit = int(page_limit) if page_limit else constants.PAGE_LIMIT
    sort_column = sort_column if sort_column else "last_modified_time"
    filters = filters if filters else {}

    if not login_user.is_admin:
        filters["resource_owner_id"] = login_user.email
    if not filters.get("datasourceId"):
        filters["datasourceId"] = login_user.datasource_ids
    else:
        filters["datasourceId"] = [filters["datasourceId"]]
    
    return storage_db.storage_db().get_resources(login_user.domain_id, filters, sort_column, sort_type, page_number, page_limit)

def export_to_csv(auth_token, is_async, filters):
    if not is_async:
        messaging.trigger_post_event(urls.RESOURCES_EXPORT, auth_token, {"isAsync": 1}, filters)
    else:
        write_to_csv(auth_token, filters)


def write_to_csv(auth_token, filters):
    if not auth_token:
        return None
    
    login_user = db_utils.get_user_session(auth_token)
    
    if not login_user.is_admin:
        filters["resource_owner_id"] = login_user.email
    
    resources = storage_db.storage_db().get_resources(login_user.domain_id, filters, None, None, 0, 100000, filters['selectedFields'])

    temp_csv = utils.convert_data_to_csv(resources, filters['selectedFields'])
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