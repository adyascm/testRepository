
from __future__ import division  # necessary

import uuid,json,time,datetime,sys
from sqlalchemy import and_

from adya.common.utils.utils import get_trusted_entity_for_domain
from adya.gsuite import gutils
from adya.common.constants import constants, urls
from adya.common.db.connection import db_connection
from adya.common.db import models
from adya.common.db.models import DataSource,Application,ApplicationUserAssociation,AppInventory
from adya.common.utils import utils
from adya.common.utils.response_messages import Logger

def query(auth_token, query_params, scanner):
    user_key = query_params["userEmail"]
    directory_service = gutils.get_directory_service(auth_token)
    tokens = []
    results = directory_service.tokens().list(userKey=user_key, quotaUser = user_key[0:41]).execute()
    if results and "items" in results:
        tokens = results["items"]
    return {"payload": tokens}

def process(db_session, auth_token, query_params, scanner_data):
    user_email = query_params["userEmail"]
    domain_id = query_params["domainId"]
    datasource_id = query_params["dataSourceId"]
    application_associations = []
    now = datetime.datetime.utcnow()
    apps_count = 0
    if scanner_data and "entities" in scanner_data:
        trusted_domain_apps = (get_trusted_entity_for_domain(db_session, domain_id))["trusted_apps"]
        for app in scanner_data["entities"]:
            apps_count += 1
            app_name = app.get("displayText")
            application = db_session.query(Application).filter(Application.display_text == app_name,Application.domain_id == domain_id).first()
            if not application:
                inventory_app = db_session.query(AppInventory).filter(AppInventory.name == app_name).first()
                inventory_app_id = inventory_app.id if inventory_app else None
                application = Application()
                if inventory_app_id:
                    application.inventory_app_id = inventory_app_id 
                    application.category = inventory_app.category
                    application.image_url = inventory_app.image_url
                application.domain_id = domain_id
                application.display_text = app_name
                application.anonymous = app.get("anonymous")
                application.timestamp = now
                application.purchased_date = now
                scopes = app["scopes"]
                if app_name in trusted_domain_apps:
                    application.score = 0
                else:
                    max_score = gutils.get_app_score(scopes)
                    application.score = max_score
                application.scopes = ','.join(scopes)
                application.unit_num = 1
                db_session.add(application)
            else:
                application.unit_num += 1
            db_connection().commit()
            association_table =  {}
            association_table["client_id"] = app.get("clientId")
            association_table["user_email"] = user_email
            association_table["datasource_id"] = datasource_id
            association_table["application_id"] = application.id
            application_associations.append(association_table)
            
    if len(application_associations) > 0:
        db_session.bulk_insert_mappings(ApplicationUserAssociation, application_associations)
        db_connection().commit()
    return apps_count
