import os

import sqlalchemy
from sqlalchemy import MetaData, Table
from sqlalchemy.pool import QueuePool

DB_DIALECT = "mysql"
DB_DRIVER = "pymysql"
DB_USERNAME = os.environ.get('USERNAME', "root")
DB_PASSWORD = os.environ.get('PASSWORD', "root")
DB_HOST = os.environ.get('DBHOST', "127.0.0.1")
DB_PORT = os.environ.get('DBPORT', "3306")
DB_NAME = os.environ.get('DBNAME', "dev")


class db_connection(object):
    _conn = None

    def __init__(self):
        if db_connection._conn is None:
            engine = sqlalchemy.create_engine(
                DB_DIALECT + "+" + DB_DRIVER + "://" + DB_USERNAME +
                ":" + DB_PASSWORD + '@' + DB_HOST + ":" + DB_PORT +
                "/" + DB_NAME, poolclass=QueuePool)

            metadata = MetaData(bind=engine)
            self._conn = metadata

    def get_conn(self):
        return self._conn
