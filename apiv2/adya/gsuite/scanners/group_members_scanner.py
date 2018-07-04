from __future__ import division  # necessary

from requests_futures.sessions import FuturesSession
import uuid,json,time,datetime,sys
from sqlalchemy import and_

from adya.gsuite import gutils

from adya.common.utils.response_messages import Logger
from adya.common.constants import constants, urls
from adya.common.db.connection import db_connection
from adya.common.db import models
from adya.common.db.models import DataSource,ResourcePermission,Resource,LoginUser,DomainUser,ResourceParent,Application,ApplicationUserAssociation,alchemy_encoder
from adya.common.utils import utils, messaging
from adya.common.email_templates import adya_emails
from adya.common.utils.response_messages import Logger

def query(auth_token, query_params, scanner):
    next_page_token = query_params["nextPageNumber"]
    group_key = query_params["groupEmail"]
    directory_service = gutils.get_directory_service(auth_token)
    members = []
    results = directory_service.members().list(groupKey=group_key, quotaUser = group_key[0:41]).execute()

    if results and "members" in results:
        members = results["members"]

    next_page_token = results.get('nextPageToken')
    return {"payload": members, "nextPageNumber": next_page_token}
    
def process(db_session, auth_token, query_params, scanner_data):
    domain_id = query_params["domainId"]
    datasource_id = query_params["dataSourceId"]
    group_key = query_params["groupEmail"]
    members_count = 0
    if scanner_data and 'entities' in scanner_data:
        is_external = False
        for group_data in scanner_data['entities']:
            member_type = group_data.get("type")
            members_count += 1
            if member_type == "CUSTOMER":
                # self.db_session.query(models.DomainUser).filter(
                #     and_(models.DomainUser.datasource_id == self.datasource_id,
                #         models.DomainUser.email == group_key)).update({'include_all_user': True})
                continue
            else:
                group = models.DirectoryStructure()
                group.datasource_id = datasource_id
                group.member_email = group_data["email"]
                group.parent_email = group_key
                group.member_id = group_data.get("id")
                group.member_role = group_data.get("role")
                group.member_type = member_type

                if not is_external and gutils.check_if_external_user(db_session, domain_id, group.member_email):
                    is_external = True
                    db_session.query(models.DomainUser).filter(and_(models.DomainUser.datasource_id == datasource_id,
                                                                    models.DomainUser.email ==  group_key)).update({"member_type":constants.EntityExposureType.EXTERNAL.value})
                db_session.add(group)
        db_connection().commit()
    return members_count
    
def post_process(db_session, auth_token, query_params):
    pass