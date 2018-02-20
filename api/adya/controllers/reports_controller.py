import json
import datetime
import uuid

from flask import request

from adya.db.models import LoginUser, DomainGroup, DomainUser, Resource, Report, ResourcePermission
from adya.db.connection import db_connection
from adya.common import utils, constants, request_session
from sqlalchemy import func, or_, and_


def get_widget_data(auth_token, widget_id):
    if not auth_token:
        return None
    session = db_connection().get_session()
    data = None
    if widget_id == 'usersCount':
        data = session.query(DomainUser).filter(DomainUser.domain_id == LoginUser.domain_id).filter(
            LoginUser.auth_token == auth_token).count()
    elif widget_id == 'groupsCount':
        data = session.query(DomainGroup).filter(DomainGroup.domain_id == LoginUser.domain_id).filter(
            LoginUser.auth_token == auth_token).count()
    elif widget_id == 'filesCount':
        data = session.query(Resource).filter(and_(Resource.domain_id == LoginUser.domain_id, Resource.resource_type != 'folder')).filter(
            LoginUser.auth_token == auth_token).count()
    elif widget_id == 'foldersCount':
        data = session.query(Resource).filter(and_(Resource.domain_id == LoginUser.domain_id, Resource.resource_type == 'folder')).filter(
            LoginUser.auth_token == auth_token).count()
    elif widget_id == 'sharedDocsByType':
        data = session.query(Resource.exposure_type, func.count(Resource.exposure_type)).group_by(Resource.exposure_type).all()
    elif widget_id == 'sharedDocsList':
        data = {}
        data["rows"] = session.query(Resource.resource_name, Resource.resource_type).filter(and_(Resource.domain_id == LoginUser.domain_id, or_(Resource.exposure_type == constants.ResourceExposureType.EXTERNAL, Resource.exposure_type == constants.ResourceExposureType.PUBLIC))).filter(
            LoginUser.auth_token == auth_token).limit(5).all()
        data["totalCount"] = session.query(Resource.resource_name, Resource.resource_type).filter(and_(Resource.domain_id == LoginUser.domain_id, or_(Resource.exposure_type == constants.ResourceExposureType.EXTERNAL, Resource.exposure_type == constants.ResourceExposureType.PUBLIC))).filter(
            LoginUser.auth_token == auth_token).count()
    elif widget_id == 'externalUsersList':
        data = {}
        data["rows"] = session.query(DomainUser.email).filter(and_(DomainUser.domain_id == LoginUser.domain_id, DomainUser.member_type == constants.UserMemberType.EXTERNAL)).filter(
            LoginUser.auth_token == auth_token).limit(5).all()
        data["totalCount"] = session.query(DomainUser.email).filter(and_(DomainUser.domain_id == LoginUser.domain_id, DomainUser.member_type == constants.UserMemberType.EXTERNAL)).filter(
            LoginUser.auth_token == auth_token).count()
    return data


def create_report(auth_token, payload):
    session = db_connection().get_session()
    report_id = str(uuid.uuid4())

    existing_user = session.query(LoginUser).filter(LoginUser.auth_token == auth_token).first()
    if existing_user:
        report = Report()
        report.domain_id = existing_user.domain_id
        report.report_id = report_id
        creation_time = datetime.datetime.utcnow().isoformat()
        if payload:
            report.name = payload["name"]
            if 'description' in payload:
                report.description = payload["description"]

            report.frequency = payload["frequency"]
            report.receivers = payload["receivers"]
            config_input = {"report_type":payload["report_type"], "selected_entity_type": payload["selected_entity_type"],
                            "selected_entity": payload["selected_entity"]}

            report.config = json.dumps(config_input)
            report.is_active = payload["is_active"]

        report.creation_time = creation_time


        session.add(report)
        try:
            session.commit()
        except Exception as ex:
            print (ex)

        return report
    else:
        return None


def get_reports(auth_token):
    if not auth_token:
        return None
    session = db_connection().get_session()
    reports_data = session.query(Report).filter(Report.domain_id == LoginUser.domain_id).filter(LoginUser.auth_token ==
                                                                                                auth_token).all()

    response = {}
    for report in reports_data:
        config_data = json.loads(report.config)
        last_trigger_time=''
        if report.last_trigger_time: last_trigger_time = report.last_trigger_time.strftime('%m/%d/%Y')
        response[report.report_id] = {
            "report_id": report.report_id,
            "name": report.name,
            "description": report.description,
            "frequency": report.frequency,
            "receivers": report.receivers,
            "creation_time": report.creation_time.strftime('%m/%d/%Y'),
            "last_trigger_time": last_trigger_time,
            "is_active": str(report.is_active),
            "report_type": config_data['report_type'],
            "selected_entity": config_data['selected_entity'],
            "selected_entity_type": config_data['selected_entity_type']

        }
    return response


def delete_report(auth_token, report_id):
    if not auth_token:
        return None
    session = db_connection().get_session()
    existing_report = session.query(Report).filter(Report.report_id == report_id).first()
    session.delete(existing_report)
    try:
        session.commit()
    except:
        print "Exception occured while delete a report"


def run_report(auth_token, report_id):
    if not auth_token:
        return None
    session = db_connection().get_session()

    get_report_info = session.query(Report.config).filter(and_(Report.domain_id == LoginUser.domain_id,
                                                               Report.report_id == report_id)).\
                                                    filter(LoginUser.auth_token == auth_token).one()

    config_data = json.loads(get_report_info[0])
    report_type = config_data.get('report_type')
    selected_entity = config_data.get('selected_entity')
    selected_entity_type = config_data.get('selected_entity_type')
    if report_type == "Permission":
        if selected_entity_type == "group":
            query_string = ResourcePermission.email == selected_entity
        elif selected_entity_type == "resource":
            query_string = ResourcePermission.resource_id == selected_entity

        get_perms_report = session.query(ResourcePermission, Resource).filter(and_(ResourcePermission.domain_id ==
                                                                         LoginUser.domain_id, query_string, Resource.resource_id
                                                                            == ResourcePermission.resource_id)).filter(LoginUser.auth_token
                                                                                                     == auth_token).all()

        return get_perms_report


    # elif report_type == "Activity":
    #
    #     get_activity_report = session.query(Activity)


def update_report(auth_token, payload):
    if not auth_token:
        return None
    session = db_connection().get_session()
    if payload:
        report_id = payload['report_id']
        session.query(Report).filter(Report.report_id == report_id).update(payload)
        try:
            session.commit()
        except Exception as ex:
            print ex
        return "successful update "
    else:
        return None
