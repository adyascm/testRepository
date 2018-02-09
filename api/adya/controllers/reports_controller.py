import json
import datetime
import uuid

from adya.db.models import LoginUser, DomainGroup, DomainUser, Resource, Report
from adya.db.connection import db_connection
from adya.common import utils

def get_widget_data(auth_token, widget_id):
    if not auth_token:
        return None
    session = db_connection().get_session()
    data = None
    if widget_id == 'usersCount':
        data = session.query(DomainUser).filter(DomainUser.domain_id == LoginUser.domain_id).filter(
            LoginUser.auth_token == auth_token).count()
    elif widget_id == 'groupsCount':
        data = 4  # data = session.query(DomainGroup).filter(DomainGroup.domain_id == LoginUser.domain_id).filter(
        # LoginUser.auth_token == auth_token).count()
    elif widget_id == 'filesCount':
        data = session.query(Resource).filter(Resource.domain_id == LoginUser.domain_id).filter(
            LoginUser.auth_token == auth_token).count()
    elif widget_id == 'foldersCount':
        data = session.query(Resource).filter(Resource.domain_id == LoginUser.domain_id).filter(
            LoginUser.auth_token == auth_token).count()
    elif widget_id == 'sharedDocsByType':
        # data = session.query(Resource).filter(Resource.domain_id == LoginUser.domain_id).filter(
        # LoginUser.auth_token == auth_token).count()
        data = {"Public": "4", "Domain": "6"}
    elif widget_id == 'sharedDocsList':
        # data = session.query(Resource).filter(Resource.domain_id == LoginUser.domain_id).filter(
        # LoginUser.auth_token == auth_token).all()
        data = [{"name": "confidentials.doc", "last_accessed": "10 mins"}]
    elif widget_id == 'externalUsersList':
        # data = session.query(Resource).filter(Resource.domain_id == LoginUser.domain_id).filter(
        # LoginUser.auth_token == auth_token).count()
        data = [{"name": "amit", "last_active": "10 mins"}]
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