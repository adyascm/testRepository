import sqlalchemy
from sqlalchemy import MetaData, Table

from adya.db.utils import db_conn


class accounts:
    def create_account(self, data_json):
        metadata = db_conn.db_connection().start_conn()
        table_name = "domain"
        table_name = Table(table_name, metadata,
                           autoload=True)  # if table already exist in database ; load it from the database
        i = table_name.insert(data_json)  # insert query ; sql statement object.
        print (i)
        i.execute()


    def get_account(self, login_email):
        metadata = db_conn.db_connection().start_conn()
        table_name = "domain"
        table_name = Table(table_name, metadata,
                           autoload=True)
        query = table_name.select()
        query = query.where(table_name.c.domain_id == login_email)
        result = query.execute()
        row = result.fetchone()
        return row


class login:
    def create_login(self, data_json):
        metadata = db_conn.db_connection().start_conn()
        table_name = "login_user"
        table_name = Table(table_name, metadata,
                           autoload=True)  # if table already exist in database ; load it from the database
        i = table_name.insert(data_json)  # insert query ; sql statement object.
        print (i)
        i.execute()


