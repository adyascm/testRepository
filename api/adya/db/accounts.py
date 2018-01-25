import datetime
import sqlalchemy
from sqlalchemy import MetaData, Table

from adya.db import db_conn
from adya.db.connection import db_connection
from adya.db.models import Account, LoginUser


class accounts:
    def create_account(self, data_json):
        session = db_connection().get_session()
        session.add(Account(**data_json))
        session.commit()

    def get_account(self, domain_id):
        session = db_connection().get_session()
        query = session \
            .query(Account) \
            .filter_by(domain_id=domain_id)
        results = query.all()
        return len(results) > 0


class login:
    def create_login(self, data_json):
        session = db_connection().get_session()
        session.add(LoginUser(**data_json))
        session.commit()

    def get_login(self, login_email):
        session = db_connection().get_session()
        query = session \
            .query(LoginUser) \
            .filter_by(email=login_email)
        results = query.all()
        return results