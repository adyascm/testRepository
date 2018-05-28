from adya.common.db.connection import db_connection
from adya.common.db import db_utils
from adya.common.db.models import Alert, DataSource
from adya.common.utils.response_messages import ResponseMessage, Logger
import uuid
import datetime


def get_alerts(auth_token):
    db_session = db_connection().get_session()
    existing_user = db_utils.get_user_session(auth_token, db_session=db_session)

    alerts = db_session.query(Alert).filter(DataSource.domain_id == existing_user.domain_id,
                                            Alert.datasource_id == DataSource.datasource_id).all()
    return alerts

def fetch_alerts_count(auth_token):
    db_session = db_connection().get_session()
    existing_user = db_utils.get_user_session(auth_token, db_session=db_session)

    alerts_count = db_session.query(Alert).filter(DataSource.domain_id == existing_user.domain_id,
                                                         Alert.datasource_id == DataSource.datasource_id,
                                                         Alert.isOpen == True).count()
    return alerts_count

def create_alerts(auth_token, payload):
    db_session = db_connection().get_session()
    if payload:
        alert = Alert()
        last_update_time = datetime.datetime.now()
        alert.alert_id = str(uuid.uuid4())
        alert.datasource_id = payload["datasource_id"]
        alert.name = payload["name"]
        alert.isOpen = True
        alert.number_of_violations = 1
        alert.last_updated = last_update_time
        alert.created_at = last_update_time
        alert.severity = payload["severity"]
        alert.policy_id = payload["policy_id"]
        alert.payload = None
        
        db_session.add(alert)
        db_connection().commit()
        return alert        

    return ResponseMessage(400, 'Bad Request')


def delete_alert_for_a_policy(policy_id):
    delete_response = None
    if policy_id:
        db_session = db_connection().get_session()
        Logger().info("delete alert for policy id: {}".format(policy_id))
        delete_response = db_session.query(Alert).filter(Alert.policy_id == policy_id).delete()
        db_connection().commit()
    return delete_response

