from __future__ import division  # necessary

import random

from requests_futures.sessions import FuturesSession
import uuid,json,time,datetime,sys
from sqlalchemy import and_

from adya.gsuite import gutils

from adya.common.utils.response_messages import Logger
from adya.common.constants import constants, urls
from adya.common.db.connection import db_connection
from adya.common.db import models
from adya.common.utils import utils
from adya.common.utils.response_messages import Logger
from googleapiclient.errors import HttpError


def query(auth_token, query_params, scanner):
    next_page_token = query_params["nextPageNumber"]
    group_key = query_params["groupEmail"]
    directory_service = gutils.get_directory_service(auth_token)
    members = []
    retry = 0
    while retry < 6:
        retry +=1
        try:
            results = directory_service.members().list(groupKey=group_key, maxResults=50,
                                                            pageToken=next_page_token, quotaUser = group_key[0:41]).execute()
            if results and "members" in results:
                members = results["members"]
                next_page_token = results.get('nextPageToken')
            break
        except HttpError as ex:
            if ex.resp.status == 403:
                # API limit reached, so retry after few seconds for 5 times
                sleep_secs = min(64, (2 ** retry)) + (random.randint(0, 1000) / 1000.0)
                Logger().warn(
                    "API limit reached while fetching the members of group in gsuite, will retry after {} secs: {}".format(sleep_secs,
                                                                                                                     next_page_token))
                time.sleep(sleep_secs)
            else:
                break
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
                member = models.DirectoryStructure()
                member.datasource_id = datasource_id
                member.member_email = group_data["email"]
                member.parent_email = group_key
                member.member_id = group_data.get("id")
                member.member_role = group_data.get("role")
                member.member_type = member_type
                db_session.add(member)

                exposure_type = utils.check_if_external_user(db_session, domain_id, member.member_email)
                if exposure_type == constants.EntityExposureType.EXTERNAL.value:
                    is_external = True

        if is_external == True:
            db_session.query(models.DomainUser).filter(and_(models.DomainUser.datasource_id == datasource_id,
                models.DomainUser.email == group_key)).update({"member_type": constants.EntityExposureType.EXTERNAL.value})

        db_connection().commit()
    return members_count
