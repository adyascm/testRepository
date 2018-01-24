import sqlalchemy
from sqlalchemy import MetaData, Table

from adya.db import db_conn


class accounts:
    def create_account(self, data_json):
        metadata = db_conn.db_connection().get_conn()
        table_name = "domain"
        table_name_obj = Table(table_name, metadata,
                           autoload=True)  # if table already exist in database ; load it from the database
        i = table_name_obj.insert(data_json)  # insert query ; sql statement object.
        print (i)
        i.execute()


    def get_account(self, login_email):
        metadata = db_conn.db_connection().get_conn()
        table_name = "domain"
        table_name_obj = Table(table_name, metadata,
                           autoload=True)
        query = table_name_obj.select()
        query = query.where(table_name_obj.c.domain_id == login_email)
        result = query.execute()
        row = result.fetchone()
        return row


class login:
    def create_login(self, data_json):
        metadata = db_conn.db_connection().get_conn()
        table_name = "login_user"
        table_name = Table(table_name, metadata,
                           autoload=True)  # if table already exist in database ; load it from the database
        i = table_name.insert(data_json)  # insert query ; sql statement object.
        print (i)
        i.execute()


