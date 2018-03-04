import os

import sqlalchemy
from sqlalchemy.pool import QueuePool
from sqlalchemy.orm import sessionmaker

from adya.common import constants
from adya.db.models import Base


class db_connection(object):
    _engine = None

    def __init__(self):
        if db_connection._engine is None:
            try:
                self._engine = sqlalchemy.create_engine("mysql+pymysql://" + constants.DB_USERNAME +
                    ":" + constants.DB_PWD + '@' + constants.DB_URL +
                    "/" + constants.DB_NAME + "?charset=utf8", encoding='utf-8', poolclass=QueuePool)
                Base.metadata.create_all(self._engine)
            except Exception as ex:
                print(ex)

    def get_session(self):
        create_session = sessionmaker(bind=self._engine,autoflush=False)
        return create_session()

    def close_conenction(self):
        try:
           connection = self._engine.connect()
           connection.close()
        except Exception as ex:
            print ex