import json
import datetime
import uuid
from sqlalchemy import func, or_, and_

from adya.core.controllers import domain_controller
from adya.common.db.models import LoginUser, DomainGroup, DomainUser, Resource, Report, ResourcePermission, DataSource, \
    Application, DirectoryStructure, ApplicationUserAssociation, alchemy_encoder
from adya.common.db.connection import db_connection
from adya.common.db import db_utils
from adya.common.constants import constants
from adya.common.utils import utils, request_session
from adya.gsuite import activities
from adya.common.utils.response_messages import Logger


def get_widget_data(auth_token, widget_id, datasource_id=None, user_email=None):

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
            user_count_query = db_session.query(ResourcePermission.email).filter( and_(
                 ResourcePermission.datasource_id.in_(domain_datasource_ids), Resource.resource_owner_id == login_user_email,
                                                    ResourcePermission.resource_id == Resource.resource_id,
                                                    DomainUser.email == ResourcePermission.email,
                                                    DomainUser.datasource_id.in_(domain_datasource_ids),
                                                    DomainUser.member_type == constants.UserMemberType.EXTERNAL)).distinct().count()
            # add 1 for loggin user
            user_count_query += 1
        else:
            user_count_query = db_session.query(DomainUser).filter(
                DomainUser.datasource_id.in_(domain_datasource_ids)).count()

        data = user_count_query
    elif widget_id == 'groupsCount':
        group_count_query = db_session.query(DomainGroup).filter(
            DomainGroup.datasource_id.in_(domain_datasource_ids))

        if is_service_account_is_enabled and not is_admin:
            group_count_query = group_count_query.filter(DirectoryStructure.datasource_id == DomainGroup.datasource_id,
                                                         DirectoryStructure.member_email == login_user_email,
                                                         DirectoryStructure.parent_email == DomainGroup.email)

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

        shared_docsByType_query = db_session.query(Resource.exposure_type, func.count(Resource.exposure_type)).filter(
            and_(Resource.exposure_type != constants.ResourceExposureType.INTERNAL,
                 Resource.datasource_id.in_(domain_datasource_ids),
                 Resource.exposure_type != constants.ResourceExposureType.PRIVATE)).group_by(Resource.exposure_type)

        if is_service_account_is_enabled and not is_admin:
            shared_docsByType_query = shared_docsByType_query.filter(Resource.resource_owner_id == login_user_email)

        shared_docs_by_type = shared_docsByType_query.all()
        public_count = 0
        external_count = 0
        domain_count = 0
        anyone_with_link_count = 0
        for share_type in shared_docs_by_type:
            if share_type[0] == constants.ResourceExposureType.EXTERNAL:
                external_count = share_type[1]
            elif share_type[0] == constants.ResourceExposureType.ANYONEWITHLINK:
                anyone_with_link_count = share_type[1]
            elif share_type[0] == constants.ResourceExposureType.PUBLIC:
                public_count = share_type[1]
            elif share_type[0] == constants.ResourceExposureType.DOMAIN:
                domain_count = share_type[1]

        data["rows"] = [[constants.DocType.PUBLIC_COUNT, public_count], [constants.DocType.ANYONE_WITH_LINK_COUNT, anyone_with_link_count], [constants.DocType.EXTERNAL_COUNT, external_count], [constants.DocType.DOMAIN_COUNT, domain_count]]
        data["totalCount"] = public_count + external_count + domain_count + anyone_with_link_count

    elif widget_id == 'sharedDocsList':
        data = {}
        shared_docs_list_query = db_session.query(Resource.resource_name, Resource.resource_type).filter(
            and_(Resource.datasource_id.in_(domain_datasource_ids),
                 or_(Resource.exposure_type == constants.ResourceExposureType.EXTERNAL,
                     Resource.exposure_type == constants.ResourceExposureType.PUBLIC,
                     Resource.exposure_type == constants.ResourceExposureType.ANYONEWITHLINK)))

        shared_docs_totalcount_query = db_session.query(Resource.resource_name, Resource.resource_type).filter(
            and_(Resource.datasource_id.in_(domain_datasource_ids),
                 or_(Resource.exposure_type == constants.ResourceExposureType.EXTERNAL,
                     Resource.exposure_type == constants.ResourceExposureType.PUBLIC,
                     Resource.exposure_type == constants.ResourceExposureType.ANYONEWITHLINK)))

        if is_service_account_is_enabled and not is_admin:
            shared_docs_list_query = shared_docs_list_query.filter(Resource.resource_owner_id == login_user_email)
            shared_docs_totalcount_query = shared_docs_totalcount_query.filter(
                Resource.resource_owner_id == login_user_email)

        data["rows"] = shared_docs_list_query.limit(5).all()
        data["totalCount"] = shared_docs_totalcount_query.count()
    elif widget_id == 'externalUsersList':
        data = {}
        external_user_list = db_session.query(ResourcePermission.email, func.count(ResourcePermission.email)).filter(
            and_(ResourcePermission.exposure_type == constants.UserMemberType.EXTERNAL,
                 ResourcePermission.datasource_id.in_(domain_datasource_ids),)).group_by(ResourcePermission.email).order_by(
            func.count(ResourcePermission.email).desc())

        if is_service_account_is_enabled and not is_admin:
            external_user_list = external_user_list.filter(and_(Resource.resource_owner_id == login_user_email,
                                                    ResourcePermission.resource_id == Resource.resource_id))


        data["rows"] = external_user_list.limit(5).all()
        data["totalCount"] = external_user_list.count()
    elif widget_id == 'userAppAccess':
        data = {}
        querydata = {}
        apps = db_session.query(Application).distinct(Application.client_id).filter(
            Application.datasource_id.in_(domain_datasource_ids))

        if is_service_account_is_enabled and not is_admin:
            apps = apps.filter(and_(Application.client_id == ApplicationUserAssociation.client_id,
                                    ApplicationUserAssociation.user_email == login_user_email,
                                    ApplicationUserAssociation.datasource_id == Application.datasource_id))

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
        file_type_query = db_session.query(Resource.resource_type, func.count(Resource.resource_type)).filter(
            and_(Resource.datasource_id.in_(domain_datasource_ids),
                 Resource.exposure_type != constants.ResourceExposureType.INTERNAL,
                 Resource.exposure_type != constants.ResourceExposureType.PRIVATE)).group_by(Resource.resource_type).order_by(
            func.count(Resource.resource_type).desc())

        if is_service_account_is_enabled and not is_admin:
            file_type_query = file_type_query.filter(Resource.resource_owner_id == login_user_email)

        all_file_types = file_type_query.all()
        first_five = all_file_types[0:5]
        others = all_file_types[5:]
        totalcount = 0
        for count in first_five:
            totalcount += count[1]
        others_count = 0
        for count in others:
            others_count += count[1]
        if others_count > 0:
            first_five.append(('Others', others_count))
            totalcount += others_count
        data["rows"] = first_five
        data["totalCount"] = totalcount

    elif widget_id == "internalUserList":
        data = {}
        internal_user_list = db_session.query(Resource.resource_owner_id, func.count(Resource.resource_id)).filter(
                         and_(Resource.datasource_id.in_(domain_datasource_ids),
                              Resource.exposure_type.in_([constants.ResourceExposureType.EXTERNAL, constants.ResourceExposureType.PUBLIC])
                              )).group_by(Resource.resource_owner_id).order_by(func.count(Resource.resource_id).desc())

        if is_service_account_is_enabled and not is_admin:
            internal_user_list = internal_user_list.filter(Resource.resource_owner_id == login_user_email)

        data["rows"] = internal_user_list.limit(5).all()
        data["totalCount"] = internal_user_list.count()

    return data


def create_report(auth_token, payload):
    db_session = db_connection().get_session()
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
            "frequency": report.frequency[5:len(report.frequency) - 1],
            "receivers": report.receivers,
            "creation_time": report.creation_time.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "last_trigger_time": last_trigger_time,
            "is_active": str(report.is_active),
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

    get_report_info = db_session.query(Report.config, Report.receivers, Report.last_trigger_time, Report.description,
                                       Report.name).filter(Report.report_id == report_id).one()

    config_data = json.loads(get_report_info[0])
    emails = str(get_report_info[1])
    email_list = emails.split(',')
    last_run_time = get_report_info[2]
    report_desc = get_report_info[3]
    report_name = get_report_info[4]

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

        get_perms_report = db_session.query(ResourcePermission, Resource).filter(and_(ResourcePermission.datasource_id == datasource_id,
                                                        query_string, Resource.resource_id == ResourcePermission.resource_id)).all()

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
    return response_data, email_list, report_type, report_desc, report_name


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
                        "selected_entity_name": payload["selected_entity_name"],
                        "datasource_id": payload["datasource_id"]}

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

    report_data, email_list, report_type, report_desc, report_name = run_report(None, report_id)
    Logger().info("generate_csv_report : report data : " + str(report_data))
    csv_records = ""
    Logger().info("report type : "+ str(report_type))
    if report_type == "Permission":

        perm_csv_display_header = ["File Name", "File Type", "Size", "Owner", "Last Modified Date", "Creation Date",
                                   "File Exposure", "User Email", "Permission"]

        perm_report_data_header = ["resource_name", "resource_type", "resource_size", "resource_owner_id",
                                   "last_modified_time", "creation_time",
                                   "exposure_type", "user_email", "permission_type"]

        Logger().info("making csv ")

        csv_records += ",".join(perm_csv_display_header) + "\n"
        for data in report_data:
            for i in range(len(perm_report_data_header)):
                if i == len(perm_report_data_header) - 1:
                    csv_records += (str(data[perm_report_data_header[i]]))
                else:
                    csv_records += (str(data[perm_report_data_header[i]])) + ','
            csv_records += "\n"

        Logger().info(str(csv_records))

    elif report_type == "Activity":

        activity_csv_display_header = ["Date", "Operation", "Datasource", "Resource", "Type", "IP Address"]

        activity_report_data_header = ["date", "operation", "datasource", "resource", "type", "ip_address"]

        csv_records += ",".join(activity_csv_display_header) + "\n"
        for data in report_data:
            for i in range(len(activity_report_data_header)):
                if i == len(activity_report_data_header) - 1:
                    csv_records += (str(data[activity_report_data_header[i]]))
                else:
                    csv_records += (str(data[activity_report_data_header[i]])) + ','
            csv_records += "\n"
        Logger().info(str(csv_records))

    Logger().info("csv_ record " + str(csv_records))
    return csv_records, email_list, report_desc, report_name
