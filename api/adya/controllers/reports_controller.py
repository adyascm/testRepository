import json
import datetime
import uuid

from adya.db.models import LoginUser, DomainGroup, DomainUser, Resource, Report
from adya.db.connection import db_connection
from adya.common import utils, constants
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
        if payload:
            report.name = payload["name"]
            if 'description' in payload:
                report.description = payload["description"]
            report.config = json.dumps(payload["config"])
            report.frequency = payload["frequency"]
            report.receivers = payload["receivers"]
        report.creation_time = datetime.datetime.utcnow().isoformat()
        report.is_active = payload["isactive"]

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
    return reports_data


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



