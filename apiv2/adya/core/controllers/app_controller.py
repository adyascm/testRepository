from adya.common.db.connection import db_connection
from adya.common.db.models import AppInventory, Application, ApplicationUserAssociation
from adya.common.utils.response_messages import ResponseMessage, Logger
from adya.common.utils import utils
from adya.common.constants import constants
from adya.core.controllers import directory_controller
import csv
import math

def get_app_stats(auth_token, datasource_id=None, user_email=None):
    if not auth_token:
        return None
    db_session = db_connection().get_session()
    data = {}
    apps_category_cost = {}
    total_cost = 0
    installed_apps_ids = [u.id for u in directory_controller.get_all_apps(auth_token)] 
    apps_query = db_session.query(Application).filter(Application.id.in_(installed_apps_ids))
    apps = apps_query.all()
    for app in apps:
        cost = utils.get_cost(app)
        category = 'un-categorised'
        if app.inventory and app.inventory.category:
            category = app.inventory.category
        if not category in apps_category_cost:
            apps_category_cost[category] = 0    
        apps_category_cost[category] += cost
        total_cost += cost
    data['rows'] = apps_category_cost 
    data['totalCount'] = str(total_cost) 
    return data

def get_installed_apps(auth_token, page_number, page_limit, app_name, sort_column_name, sort_order):
    db_session = db_connection().get_session()
    if not auth_token:
        return None
    page_number = int(page_number) if page_number else 0
    total_pages_count = None
    page_limit = page_limit if page_limit else constants.INSTALLED_APPS_PAGE_LIMIT
    installed_apps_ids = [u.id for u in directory_controller.get_all_apps(auth_token)]
    apps_query = db_session.query(Application).filter(Application.id.in_(installed_apps_ids))
    if app_name:
        apps_query = apps_query.filter(Application.display_text.ilike("%" + app_name + "%"))
    if not page_number:
        if apps_query.count():
            total_pages_count = int(math.ceil(float(apps_query.count())/page_limit))
    if sort_column_name == "score": 
        if sort_order == 'desc':
            apps_query = apps_query.order_by(Application.score.desc())
        else:
            apps_query = apps_query.order_by(Application.score.asc())    
    elif sort_column_name == "annual_cost" or sort_column_name == "unit_price":
        if sort_order == 'desc':
            apps_query = apps_query.order_by(Application.unit_price.desc())
        else:
            apps_query = apps_query.order_by(Application.unit_price.asc()) 
    elif sort_column_name == 'category':
        if sort_order == 'desc':
            apps_query = apps_query.outerjoin(AppInventory,AppInventory.id == Application.inventory_app_id).order_by(AppInventory.category.desc())
        else:
            apps_query = apps_query.outerjoin(AppInventory,AppInventory.id == Application.inventory_app_id).order_by(AppInventory.category.asc())
    elif sort_column_name == 'application':
        if sort_order == 'desc':
            apps_query = apps_query.order_by(Application.display_text.desc())
        else:
            apps_query = apps_query.order_by(Application.display_text.asc())
    elif sort_column_name == "num_users":
        if sort_order == 'desc':
            apps_query = apps_query.order_by(Application.unit_num.desc())
        else:
            apps_query = apps_query.order_by(Application.unit_num.asc())
    elif sort_column_name == 'potential_saving':
        if sort_order == 'desc':
            apps_query = apps_query.order_by(Application.inactive_users.desc())
        else:
            apps_query = apps_query.order_by(Application.inactive_users.asc())       
    apps_query = apps_query.offset(page_number * page_limit).limit(page_limit)        
    installed_apps = apps_query.all()
    for app in installed_apps:
        app.is_installed_via_ds = db_session.query(ApplicationUserAssociation).filter(ApplicationUserAssociation.application_id == app.id).count() > 0
        if app.inventory:
            app.image_url = app.inventory.image_url
            app.category = app.inventory.category
            app.desc_name = app.inventory.desc_name
            app.rating = app.inventory.rating
    return installed_apps, total_pages_count


def get_inventory_apps(auth_token, page_num, page_limit, prefix=""):
    db_session = db_connection().get_session()
    total_pages_count = None
    page_num = int(page_num) if page_num else 0
    page_limit = page_limit if page_limit else constants.INVENTORY_APPS_PAGE_LIMIT
    installed_apps_name = [u.display_text for u in directory_controller.get_all_apps(auth_token)]
    apps_query = db_session.query(AppInventory).filter(~AppInventory.name.in_(installed_apps_name))
    if prefix:
        apps_query = apps_query.filter(AppInventory.name.ilike("%" + prefix + "%"))
    apps_query = apps_query.offset(page_num * page_limit)
    if not page_num:
        if apps_query.count():
            total_pages_count = int(math.ceil(float(apps_query.count())/page_limit))
    apps = apps_query.limit(page_limit).all()   
    return apps,total_pages_count

