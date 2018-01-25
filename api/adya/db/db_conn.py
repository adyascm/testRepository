import os

import sqlalchemy
from sqlalchemy import MetaData, Table
from sqlalchemy.pool import QueuePool
from sqlalchemy.orm import sessionmaker

from adya.common import constants
from adya.db.dbschema.models import Base

class db_connection(object):
    _engine = None

    def __init__(self):
        if db_connection._engine is None:
            self._engine = sqlalchemy.create_engine("mysql+pymysql://" + constants.DB_USERNAME +
                ":" + constants.DB_PWD + '@' + constants.DB_URL +
                "/" + constants.DB_NAME, poolclass=QueuePool)
            Base.metadata.create_all(self._engine)

    def get_session(self):
        create_session = sessionmaker(bind=self._engine)
        return create_session()
