import json
import datetime
import uuid
from sqlalchemy import func, or_, and_

from adya.core.controllers import domain_controller, directory_controller, app_controller
from adya.common.db.models import LoginUser, DomainUser, Resource, Report, ResourcePermission, DataSource, \
    Application, DirectoryStructure, ApplicationUserAssociation, AppInventory, alchemy_encoder
from adya.common.db.connection import db_connection
from adya.common.db import db_utils, storage_db, activity_db
from adya.common.constants import constants
from adya.common.utils import utils, request_session
from adya.gsuite.activities import activities
from adya.common.utils.response_messages import Logger
from adya.common.constants import default_reports
from adya.common.constants.constants import datasource_to_default_report_map

def get_widget_data(auth_token, widget_id, datasource_id=None, user_email=None, event_filters = None):
    if not (auth_token or datasource_id):
        return None

    db_session = db_connection().get_session()

    is_admin = False
    login_user_email = user_email
    is_service_account_is_enabled = True
    domain_datasource_ids = []

    if auth_token:
        existing_user = db_utils.get_user_session(auth_token)
        user_domain_id = existing_user.domain_id
        login_user_email = existing_user.email
        is_admin = existing_user.is_admin
        is_service_account_is_enabled = existing_user.is_serviceaccount_enabled
        datasource_ids = db_session.query(DataSource.datasource_id).filter(
            DataSource.domain_id == user_domain_id).all()
        domain_datasource_ids = [r for r, in datasource_ids]
    elif datasource_id:
        datasource = db_session.query(DataSource).filter(
            DataSource.datasource_id == datasource_id).first()
        is_service_account_is_enabled = datasource.is_serviceaccount_enabled
        domain_datasource_ids = [datasource.datasource_id]

    data = None
    if widget_id == 'usersCount':

        if is_service_account_is_enabled and not is_admin:
            user_count_query = db_session.query(ResourcePermission.email).filter(and_(
                ResourcePermission.datasource_id.in_(domain_datasource_ids),
                Resource.datasource_id == ResourcePermission.datasource_id,
                Resource.resource_owner_id == login_user_email,
                ResourcePermission.resource_id == Resource.resource_id,
                DomainUser.email == ResourcePermission.email,
                DomainUser.datasource_id.in_(domain_datasource_ids),
                DomainUser.member_type == constants.EntityExposureType.EXTERNAL.value)).distinct().count()
            # add 1 for loggin user
            user_count_query += 1
        else:
            user_count_query = db_session.query(DomainUser.email).filter(
                DomainUser.datasource_id.in_(domain_datasource_ids)).distinct().count()

        data = user_count_query
    elif widget_id == 'groupsCount':
        group_count_query = db_session.query(DomainUser).filter(
            DomainUser.datasource_id.in_(domain_datasource_ids)).filter(
            DomainUser.type != constants.DirectoryEntityType.USER.value)

        if is_service_account_is_enabled and not is_admin:
            group_count_query = group_count_query.filter(DirectoryStructure.datasource_id == DomainUser.datasource_id,
                                                         DirectoryStructure.member_email == login_user_email,
                                                         DirectoryStructure.parent_email == DomainUser.email)

        data = group_count_query.count()
    elif widget_id == 'filesCount':
        file_count_query = db_session.query(Resource).filter(
            and_(Resource.datasource_id.in_(domain_datasource_ids), Resource.resource_type != 'folder'))
        if is_service_account_is_enabled and not is_admin:
            file_count_query = file_count_query.filter(Resource.resource_owner_id == login_user_email)

        data = file_count_query.count()
    elif widget_id == 'foldersCount':
        folder_count_query = db_session.query(Resource).filter(
            and_(Resource.datasource_id.in_(domain_datasource_ids), Resource.resource_type == 'folder'))
        if is_service_account_is_enabled and not is_admin:
            folder_count_query = folder_count_query.filter(Resource.resource_owner_id == login_user_email)

        data = folder_count_query.count()

    elif widget_id == 'sharedDocsByType':
        data = {}
        filters = {"datasourceId": domain_datasource_ids}
        filters["exposureType"] = [constants.EntityExposureType.PUBLIC.value, constants.EntityExposureType.ANYONEWITHLINK.value, constants.EntityExposureType.EXTERNAL.value, constants.EntityExposureType.DOMAIN.value, constants.EntityExposureType.TRUSTED.value]
        
        if is_service_account_is_enabled and not is_admin:
            filters["ownerEmailId"] = login_user_email
        shared_docs_by_type = storage_db.storage_db().get_resources_stat(user_domain_id, filters, "exposure_type")
        print shared_docs_by_type
        public_count = 0
        external_count = 0
        domain_count = 0
        anyone_with_link_count = 0
        trusted_count = 0
        for share_type in shared_docs_by_type:
            if share_type["_id"] == constants.EntityExposureType.EXTERNAL.value:
                external_count = share_type["count"]
            elif share_type["_id"] == constants.EntityExposureType.ANYONEWITHLINK.value:
                anyone_with_link_count = share_type["count"]
            elif share_type["_id"] == constants.EntityExposureType.PUBLIC.value:
                public_count = share_type["count"]
            elif share_type["_id"] == constants.EntityExposureType.DOMAIN.value:
                domain_count = share_type["count"]
            elif share_type["_id"] == constants.EntityExposureType.TRUSTED.value:
                trusted_count = share_type["count"]

        data["rows"] = [[constants.DocType.PUBLIC_COUNT.value, public_count],
                        [constants.DocType.ANYONE_WITH_LINK_COUNT.value, anyone_with_link_count],
                        [constants.DocType.EXTERNAL_COUNT.value, external_count],
                        [constants.DocType.DOMAIN_COUNT.value, domain_count],
                        [constants.DocType.TRUSTED.value, trusted_count]]
        data["totalCount"] = public_count + external_count + domain_count + anyone_with_link_count + trusted_count

    elif widget_id == 'externalUsersList':
        data = {}
        filters = {"datasourceId": domain_datasource_ids}
        filters["exposureType"] = [constants.EntityExposureType.PUBLIC.value, constants.EntityExposureType.ANYONEWITHLINK.value, constants.EntityExposureType.EXTERNAL.value, constants.EntityExposureType.DOMAIN.value, constants.EntityExposureType.TRUSTED.value]
        
        if is_service_account_is_enabled and not is_admin:
            filters["ownerEmailId"] = login_user_email
        external_users_with_access = storage_db.storage_db().get_resources_stat(user_domain_id, filters, "external_users", 5, unwind=True)
        exposure_by_external_users = []
        for owner in external_users_with_access:
            exposure_by_external_users.append((owner["_id"], owner["count"]))

        data["rows"] = exposure_by_external_users
        data["totalCount"] = 2
    elif widget_id == 'userAppAccess':
        data = {}
        apps = db_session.query(Application).distinct(Application.id).filter(
            Application.id == ApplicationUserAssociation.application_id,
            ApplicationUserAssociation.datasource_id.in_(domain_datasource_ids))

        if is_service_account_is_enabled and not is_admin:
            apps = apps.filter(ApplicationUserAssociation.user_email == login_user_email)

        severity = {}
        low = apps.filter(Application.score < 4).count()
        medium = apps.filter(and_(Application.score >= 4, Application.score < 7)).count()
        high = apps.filter(and_(Application.score >= 7, Application.score <= 10)).count()
        severity['Low Risk'] = low
        severity['Medium Risk'] = medium
        severity['High Risk'] = high
        data["rows"] = severity
        data["totalCount"] = low + medium + high
    elif widget_id == 'filesWithFileType':
        data = {}
        filters = {"datasourceId": domain_datasource_ids}
        filters["exposureType"] = [constants.EntityExposureType.PUBLIC.value, constants.EntityExposureType.ANYONEWITHLINK.value, constants.EntityExposureType.EXTERNAL.value, constants.EntityExposureType.DOMAIN.value, constants.EntityExposureType.TRUSTED.value]
        
        if is_service_account_is_enabled and not is_admin:
            filters["ownerEmailId"] = login_user_email
        shared_docs_by_file_type = storage_db.storage_db().get_resources_stat(user_domain_id, filters, "resource_type")

        first_five = []
        totalcount = 0
        for count in shared_docs_by_file_type[0:5]:
            first_five.append((count["_id"], count["count"]))
            totalcount += count["count"]
            
        others_count = 0
        for count in shared_docs_by_file_type[5:]:
            others_count += count["count"]
        if others_count > 0:
            first_five.append(('Others', others_count))
            totalcount += others_count
        data["rows"] = first_five
        data["totalCount"] = totalcount

    elif widget_id == "internalUserList":
        data = {}
        filters = {"datasourceId": domain_datasource_ids}
        filters["exposureType"] = [constants.EntityExposureType.PUBLIC.value, constants.EntityExposureType.ANYONEWITHLINK.value, constants.EntityExposureType.EXTERNAL.value, constants.EntityExposureType.DOMAIN.value, constants.EntityExposureType.TRUSTED.value]
        
        if is_service_account_is_enabled and not is_admin:
            filters["ownerEmailId"] = login_user_email
        owners_with_shared_docs = storage_db.storage_db().get_resources_stat(user_domain_id, filters, "resource_owner_id", 5)
        exposure_by_owners = []
        for owner in owners_with_shared_docs:
            exposure_by_owners.append((owner["_id"], owner["count"]))

        data["rows"] = exposure_by_owners
        data["totalCount"] = 3
    elif widget_id == 'expensesByCategory':
        data = app_controller.get_app_stats(auth_token)

    elif widget_id == 'activitiesByEventType':
        activities = activity_db.activity_db().get_event_stats(event_filters, None, None)
        series_map = {}
        for activity in activities:
            print activity
            event_type = activity["event_type"]
            date = str(activity["year"]) + "-" +str(activity["month"]) + "-" + str(activity["day"])
            if event_type in series_map:
                series_map[event_type]["data"][date] = activity["count"]
            else:
                series_map[event_type] = {"name": event_type, "data": {}}
        print series_map
        data = series_map.values()

    return data


def create_report(auth_token, payload):
    db_session = db_connection().get_session()
    if "is_default" in payload:
        result = []
        db_session = db_connection().get_session()
        datasource_id = payload["datasource_id"]
        login_user = db_utils.get_user_session(auth_token).email
        domain_id = db_session.query(DataSource).filter(
            DataSource.datasource_id == datasource_id).first().domain_id
        reports = default_reports.default_reports
        datasource_type = db_utils.get_datasource(datasource_id).datasource_type
        default_datasource_reports = datasource_to_default_report_map[datasource_type]
        if default_datasource_reports:
            reports.extend(default_datasource_reports)
        for report in reports:
            existing_report = db_session.query(Report).filter(Report.domain_id == domain_id,
                                                              Report.name == report["name"]).first()
            if not existing_report:
                report["receivers"] = login_user
                report["datasource_id"] = datasource_id
                result.append(insert_entry_into_report_table(db_session, auth_token, report))    
        return result
    else:
        return [insert_entry_into_report_table(db_session, auth_token, payload)]
        


def get_reports(auth_token):
    if not auth_token:
        return None
    db_session = db_connection().get_session()
    reports_data = db_session.query(Report).filter(Report.domain_id == LoginUser.domain_id).filter(
        LoginUser.auth_token ==
        auth_token).all()

    response = {}
    for report in reports_data:
        config_data = json.loads(report.config)
        last_trigger_time = ''
        if report.last_trigger_time: last_trigger_time = report.last_trigger_time.strftime("%Y-%m-%dT%H:%M:%SZ")
        response[report.report_id] = {
            "report_id": report.report_id,
            "name": report.name,
            "description": report.description,
            "frequency": report.frequency,
            "receivers": report.receivers,
            "creation_time": report.creation_time.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "last_trigger_time": last_trigger_time,
            "is_active": report.is_active,
            "report_type": config_data['report_type'],
            "selected_entity": config_data['selected_entity'],
            "selected_entity_type": config_data['selected_entity_type'],
            "selected_entity_name": config_data['selected_entity_name']
        }
    return response


def delete_report(auth_token, report_id):
    if not auth_token:
        return None
    db_session = db_connection().get_session()
    existing_report = db_session.query(Report).filter(Report.report_id == report_id).first()
    db_session.delete(existing_report)
    try:
        db_connection().commit()
    except:
        Logger().exception("Exception occured while delete a report")

    return existing_report


def run_report(auth_token, report_id):
    db_session = db_connection().get_session()

    get_report_info = db_session.query(Report).filter(Report.report_id == report_id).first()
    if not get_report_info:
        Logger().info("No report exist")
        return None
    config_data = json.loads(get_report_info.config)
    emails = str(get_report_info.receivers)
    email_list = emails.split(',')
    last_run_time = get_report_info.last_trigger_time
    report_desc = get_report_info.description
    report_name = get_report_info.name

    report_type = config_data.get('report_type')
    selected_entity = config_data.get('selected_entity')
    selected_entity_type = config_data.get('selected_entity_type')

    datasource_id = config_data.get('datasource_id')
    response_data = []
    if report_type == "Permission":
        if selected_entity_type == "user":
            query_string = ResourcePermission.email == selected_entity
        elif selected_entity_type == "resource":
            query_string = ResourcePermission.resource_id == selected_entity

        get_perms_report = db_session.query(ResourcePermission, Resource).filter(
            and_(ResourcePermission.datasource_id == datasource_id,
                 query_string,
                 Resource.datasource_id == ResourcePermission.datasource_id,
                 Resource.resource_id == ResourcePermission.resource_id)).all()

        for perm_Report in get_perms_report:
            data_map = {
                "resource_name": perm_Report.Resource.resource_name,
                "resource_type": perm_Report.Resource.resource_type,
                "resource_size": perm_Report.Resource.resource_size,
                "resource_owner_id": perm_Report.Resource.resource_owner_id,
                "last_modified_time": str(perm_Report.Resource.last_modified_time),
                "creation_time": str(perm_Report.Resource.creation_time),
                "exposure_type": perm_Report.Resource.exposure_type,
                "user_email": perm_Report.ResourcePermission.email,
                "permission_type": perm_Report.ResourcePermission.permission_type
            }

            response_data.append(data_map)

    elif report_type == "Activity":
        if selected_entity_type == "user":
            get_activity_report = activities.get_activities_for_user(auth_token,
                                                                     selected_entity,
                                                                     last_run_time)
            for datalist in get_activity_report:
                data_map = {
                    "date": datalist[0],
                    "operation": datalist[1],
                    "resource": datalist[2],
                    "type": datalist[3],
                    "ip_address": datalist[4]

                }
                response_data.append(data_map)
    elif report_type == "Inactive":
        domain_id = db_session.query(Report).filter(Report.report_id == report_id).first().domain_id
        ninety_days_ago = datetime.datetime.utcnow() - datetime.timedelta(days=90)
        datasources = db_session.query(DataSource).filter(DataSource.domain_id == domain_id).all()
        datasource_ids = [r.datasource_id for r in datasources]
        domain_users = db_session.query(DomainUser).filter(DomainUser.datasource_id.in_(datasource_ids),
                                                           DomainUser.last_login_time < ninety_days_ago,
                                                           DomainUser.member_type == constants.EntityExposureType.INTERNAL.value,
                                                           DomainUser.type == constants.DirectoryEntityType.USER.value).all()
        for user in domain_users:
            user_num_days = (datetime.datetime.utcnow() - user.last_login_time).days
            data_map = {
                "name": user.full_name,
                "email": user.email,
                "login_time": str(user.last_login_time),
                "num_days": user_num_days
            }
            response_data.append(data_map)
    elif report_type == 'EmptyGSuiteGroup':
        domain_id = db_session.query(Report).filter(Report.report_id == report_id).first().domain_id
        parent_emails = [r.parent_email for r in db_session.query(DirectoryStructure).filter(datasource_id == datasource_id).all()]
        empty_grps = db_session.query(DomainUser).filter(DomainUser.type == constants.DirectoryEntityType.GROUP.value, DomainUser.datasource_id == datasource_id, ~DomainUser.email.in_(parent_emails))
        for grp in empty_grps:
            data_map = {
                "name":grp.full_name,
                "email":grp.email
            }          
            response_data.append(data_map)
    elif report_type == 'EmptySlackChannel':
        domain_id = db_session.query(Report).filter(Report.report_id == report_id).first().domain_id
        parent_emails = [r.parent_email for r in db_session.query(DirectoryStructure).filter(datasource_id == datasource_id).all()]
        empty_grps = db_session.query(DomainUser).filter(DomainUser.type == constants.DirectoryEntityType.CHANNEL.value, DomainUser.datasource_id == datasource_id, ~DomainUser.email.in_(parent_emails))
        for grp in empty_grps:
            data_map = {
                "name":grp.full_name,
                "email":grp.email
            }          
            response_data.append(data_map)

    final_response = {"response_data": response_data, "email_list": email_list, "report_type": report_type,
                      "report_desc": report_desc, "report_name": report_name}
    return final_response


def update_report(auth_token, payload):
    if not auth_token:
        return None
    db_session = db_connection().get_session()
    if payload:
        report = {}
        report["name"] = payload["name"]
        if 'description' in payload:
            report["description"] = payload["description"]

            report["frequency"] = payload["frequency"]
        report["receivers"] = payload["receivers"]
        config_input = {"report_type": payload["report_type"],
                        "selected_entity_type": payload["selected_entity_type"],
                        "selected_entity": payload["selected_entity"],
                        "datasource_id": payload["datasource_id"],
                        "selected_entity_name": payload["selected_entity_name"]
                        }

        report["config"] = json.dumps(config_input)
        report["is_active"] = payload["is_active"]
        report_id = payload["report_id"]
        db_session.query(Report).filter(Report.report_id == report_id).update(report)
        try:
            db_connection().commit()
        except Exception as ex:
            Logger().exception()
        return payload
    else:
        return None


def generate_csv_report(report_id):
    Logger().info("generate_csv_report :  start")
    response = run_report(constants.INTERNAL_SECRET, report_id)
    csv_records = ""
    if response:
        report_data = response['response_data']
        report_type = response['report_type']

        Logger().info("generate_csv_report : report data : " + str(report_data))
        Logger().info("report type : " + str(report_type))
        if report_data and len(report_data) > 0:
            if report_type == "Permission":
                csv_display_header = ["File Name", "File Type", "Size", "Owner", "Last Modified Date", "Creation Date",
                                      "File Exposure", "User Email", "Permission"]
                report_data_header = ["resource_name", "resource_type", "resource_size", "resource_owner_id",
                                      "last_modified_time", "creation_time",
                                      "exposure_type", "user_email", "permission_type"]

            elif report_type == "Activity":
                csv_display_header = ["Date", "Operation", "Datasource", "Resource", "Type", "IP Address"]
                report_data_header = ["date", "operation", "datasource", "resource", "type", "ip_address"]

            elif report_type == 'Inactive':
                csv_display_header = ['Name', 'Email', 'Last Login', 'Number of days since last login']
                report_data_header = ["name", 'email', 'login_time', 'num_days']
            elif report_type == 'EmptyGSuiteGroup' or report_type == 'EmptySlackChannel':
                csv_display_header = ['Name','Email']
                report_data_header = ["name",'email']

            Logger().info("making csv")

            csv_records += ",".join(csv_display_header) + "\n"
            for data in report_data:
                for i in range(len(report_data_header)):
                    if i == len(report_data_header) - 1:
                        csv_records += (str(data[report_data_header[i]]))
                    else:
                        csv_records += (str(data[report_data_header[i]])) + ','
                csv_records += "\n"

            Logger().info("csv_ record " + str(csv_records))

    response['csv_records'] = csv_records
    return response

def insert_entry_into_report_table(db_session, auth_token, payload):
    report_id = str(uuid.uuid4())
    existing_user = db_session.query(LoginUser).filter(LoginUser.auth_token == auth_token).first()
    if existing_user:
        report = Report()
        report.domain_id = existing_user.domain_id
        report.report_id = report_id
        creation_time = datetime.datetime.utcnow()
        if payload:
            report.name = payload["name"]
            if 'description' in payload:
                report.description = payload["description"]

            report.frequency = payload["frequency"]
            report.receivers = payload["receivers"]
            config_input = {"report_type": payload["report_type"],
                            "selected_entity_type": payload["selected_entity_type"],
                            "selected_entity": payload["selected_entity"],
                            "selected_entity_name": payload["selected_entity_name"],
                            "datasource_id": payload["datasource_id"]}

            report.config = json.dumps(config_input)
            report.is_active = payload["is_active"]

        report.creation_time = creation_time

        db_session.add(report)
        try:
            db_connection().commit()
        except Exception as ex:
            Logger().exception()

        return report
    else:
        return None


