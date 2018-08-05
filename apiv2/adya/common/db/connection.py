import os

import sqlalchemy
from sqlalchemy.pool import QueuePool
from sqlalchemy.orm import sessionmaker
from sqlalchemy.orm import scoped_session

from adya.common.constants import constants
from adya.common.db.models import Base
from adya.common.utils.response_messages import Logger


class db_connection:
    class __db_connection:
        _engine = None
        _session_factory = None
        _session = None
        def __init__(self):
            self._engine = sqlalchemy.create_engine("mysql+pymysql://" + constants.DB_USERNAME +
                    ":" + constants.DB_PWD + '@' + constants.DB_URL +
                    "/" + constants.DB_NAME + "?charset=utf8", encoding='utf-8', poolclass=QueuePool)
            Base.metadata.create_all(self._engine)
            self._session_factory = sessionmaker(bind=self._engine)
        
        def get_session(self):
            if not self._session:
                self._session = self._session_factory()
            return self._session

        def commit(self):
            try:
                self._session.commit()
            except:
                self._session.rollback()
                raise

        def close_connection(self):
            if self._session:
                self._session.close()
                self._session = None

    instance = None
    def __init__(self):
        if not db_connection.instance:
            db_connection.instance = db_connection.__db_connection()
    def __getattr__(self, name):
        return getattr(self.instance, name)

