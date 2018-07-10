import json
from datetime import datetime

from sqlalchemy import and_

from adya.common.constants import constants
import os

from adya.common.constants.constants import TrustedTypes
from adya.common.db import models
from adya.common.db.connection import db_connection
from adya.common.db.models import DomainUser, ResourcePermission, Resource, Application, ApplicationUserAssociation, \
    AppInventory, AppLicenseInventory, TrustedEntities
from adya.common.utils.response_messages import Logger

def get_call_with_authorization_header(session, url, auth_token):
    headers = {"Authorization": auth_token}
    if not url.startswith('http'):
        url = constants.API_HOST + url
    return session.get(url=url, headers=headers)

def delete_call_with_authorization_header(session, url, auth_token, json):
    headers = {"Authorization": auth_token}
    if not url.startswith('http'):
        url = constants.API_HOST + url
    return session.delete(url=url, json=json, headers=headers)


def post_call_with_authorization_header(session, url, auth_token, json, extra_headers = {}):
    headers = {"Authorization": auth_token, "Content-Type": "application/json"}
    for header in extra_headers:
        headers[header] = extra_headers[header]
    if not url.startswith('http'):
        url = constants.API_HOST + url
    return session.post(url=url, json=json, headers=headers)

def update_call_with_authorization_header(session, url, auth_token, json):
    headers = {"Authorization": auth_token, "Content-Type": "application/json"}
    if not url.startswith('http'):
        url = constants.API_HOST + url
    return session.put(url=url, json=json, headers=headers)


def get_role_type(role):
    role = role.lower()
    if role == "write":
        return constants.Role.WRITER.value
    elif role == "read":
        return constants.Role.READER.value
    elif role == "commenter":
        return constants.Role.COMMENTER.value
    elif role == "organizer":
        return constants.Role.ORGANIZER.value
    elif role == "owner":
        return constants.Role.OWNER.value

def get_domain_name_from_email(email):
    if not "@" in email:
        return ""
    index_of_strudel_from_last = len(email) - email.index('@')
    domain_name = email[-index_of_strudel_from_last + 1:]
    return domain_name

def get_cost(app):
    cost = 0
    if app.unit_num and app.unit_price:
        if app.pricing_model == 'MONTHLY':
            cost = float(app.unit_num * app.unit_price * 12)    
        else:
            cost = float(app.unit_num * app.unit_price)    
    return cost


def update_data_for_trutsted_entities(db_session, datasource_id, domain_id):
    trusted_entities = db_session.query(models.TrustedEntities).filter(
        models.TrustedEntities.domain_id == domain_id).first()
    if not trusted_entities:
        return
    trusted_domains = trusted_entities.trusted_domains
    trusted_domains_list = trusted_domains.split(',') if trusted_domains else []

    trusted_apps = trusted_entities.trusted_apps
    trusted_apps_list = trusted_apps.split(',') if trusted_apps else []

    if len(trusted_domains_list) > 0:
        for trusted_domain in trusted_domains_list:
            update_data_for_trusted_domains(db_session, [datasource_id], trusted_domain)
    # update apps data
    if len(trusted_apps_list) > 0:
       db_session.query(Application).filter(and_(Application.id == ApplicationUserAssociation.application_id,
                                ApplicationUserAssociation.datasource_id == datasource_id,
                                Application.display_text.in_(trusted_apps_list))).update({Application.score: 0})

    db_connection().commit()


def update_data_for_trusted_domains(db_session, datasource_ids, new_trusted_domain):
    # update the domain user table ; make the user as trusted if he belongs to given trusted domain
    db_session.query(DomainUser).filter(and_(DomainUser.datasource_id.in_(datasource_ids),
                                             DomainUser.email.endswith("%{0}".format(new_trusted_domain)))). \
        update({DomainUser.member_type: constants.EntityExposureType.TRUSTED.value}
               , synchronize_session='fetch')

    resource_perms = db_session.query(ResourcePermission).filter(
        and_(ResourcePermission.datasource_id.in_(datasource_ids),
             ResourcePermission.email.endswith(
                 "%{0}".format(new_trusted_domain)))).all()

    resource_ids = set()
    for perm in resource_perms:
        perm.exposure_type = constants.EntityExposureType.TRUSTED.value
        resource_ids.add(perm.resource_id)

    db_connection().commit()

    for resource_id in resource_ids:
        external_permission_check = db_session.query(ResourcePermission).filter(
            and_(ResourcePermission.datasource_id.in_(datasource_ids),
                 ResourcePermission.resource_id == resource_id,
                 ResourcePermission.exposure_type == constants.EntityExposureType.EXTERNAL.value)).count()

        if external_permission_check <= 0:
            db_session.query(Resource).filter(
                and_(Resource.datasource_id.in_(datasource_ids), Resource.resource_id == resource_id)). \
                update({Resource.exposure_type: constants.EntityExposureType.TRUSTED.value}, synchronize_session='fetch')


def add_license_for_scanned_app(db_session, datasource):
    app_name = constants.datasource_to_installed_app_map[datasource.datasource_type]
    application = db_session.query(Application).filter(
        and_(Application.domain_id == datasource.domain_id, Application.display_text == app_name)).first()
    now = datetime.utcnow()
    unit_price = None
    inventory_app = db_session.query(AppInventory).filter(AppInventory.name == app_name).first()
    inventory_app_id = inventory_app.id if inventory_app else None
    if inventory_app_id:
            unit_price = db_session.query(AppLicenseInventory).filter(AppLicenseInventory.app_id == inventory_app_id,
                                                                      AppLicenseInventory.price > 0).first()
    if not application:
        application = Application()
        application.domain_id = datasource.domain_id
        application.display_text = app_name
        application.timestamp = now
        application.purchased_date = now
        application.unit_num = datasource.total_user_count
        if inventory_app_id:
            application.inventory_app_id = inventory_app_id
        if unit_price:
            application.unit_price = unit_price.price
        db_session.add(application)
    else:
        application.timestamp = now
        application.purchased_date = now
        application.unit_num = datasource.total_user_count
    db_connection().commit()


def get_trusted_entity_for_domain(db_session, domain_id):
    trusted_entities_data = db_session.query(TrustedEntities).filter(TrustedEntities.domain_id == domain_id).first()
    trusted_domains_list = []
    trusted_apps_list = []

    if trusted_entities_data:
        trusted_domains = trusted_entities_data.trusted_domains
        trusted_domains_list = trusted_domains.split(',') if trusted_domains else []

        trusted_apps = trusted_entities_data.trusted_apps
        trusted_apps_list = trusted_apps.split(',') if trusted_apps else []

    return {'trusted_domains': trusted_domains_list, 'trusted_apps': trusted_apps_list}


def check_if_external_user(db_session, domain_id, email):
    exposure_type = constants.EntityExposureType.INTERNAL.value
    if '@' in email and not email.endswith(domain_id):
        exposure_type = constants.EntityExposureType.EXTERNAL.value
        trusted_domains_list = (get_trusted_entity_for_domain(db_session, domain_id))['trusted_domains']
        for trusted_domain in trusted_domains_list:
            if email.endswith(trusted_domain):
                exposure_type = constants.EntityExposureType.TRUSTED.value
                break

    return exposure_type


def get_highest_exposure_type(permission_exposure, highest_exposure):
    if permission_exposure == constants.EntityExposureType.PUBLIC.value:
        highest_exposure = constants.EntityExposureType.PUBLIC.value
    elif permission_exposure == constants.EntityExposureType.ANYONEWITHLINK.value and not highest_exposure == constants.EntityExposureType.PUBLIC.value:
        highest_exposure = constants.EntityExposureType.ANYONEWITHLINK.value
    elif permission_exposure == constants.EntityExposureType.EXTERNAL.value and not (highest_exposure == constants.EntityExposureType.ANYONEWITHLINK.value or highest_exposure == constants.EntityExposureType.PUBLIC.value):
        highest_exposure = constants.EntityExposureType.EXTERNAL.value
    elif permission_exposure == constants.EntityExposureType.TRUSTED.value and not \
                (highest_exposure == constants.EntityExposureType.ANYONEWITHLINK.value
                 or highest_exposure == constants.EntityExposureType.PUBLIC.value or highest_exposure == constants.EntityExposureType.EXTERNAL.value):
        highest_exposure = constants.EntityExposureType.TRUSTED.value
    elif permission_exposure == constants.EntityExposureType.DOMAIN.value and not (highest_exposure == constants.EntityExposureType.PUBLIC.value or
                                                    highest_exposure == constants.EntityExposureType.ANYONEWITHLINK.value or
                                                highest_exposure == constants.EntityExposureType.EXTERNAL.value or
                                                highest_exposure == constants.EntityExposureType.TRUSTED.value):
        highest_exposure = constants.EntityExposureType.DOMAIN.value
    elif permission_exposure == constants.EntityExposureType.INTERNAL.value and not (highest_exposure == constants.EntityExposureType.PUBLIC.value or
                                                highest_exposure == constants.EntityExposureType.ANYONEWITHLINK.value or
                                            highest_exposure == constants.EntityExposureType.EXTERNAL.value or
                                        highest_exposure == constants.EntityExposureType.DOMAIN.value or
                                     highest_exposure == constants.EntityExposureType.TRUSTED.value):
        highest_exposure = constants.EntityExposureType.INTERNAL.value
    return highest_exposure
