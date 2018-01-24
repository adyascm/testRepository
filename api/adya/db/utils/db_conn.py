import sqlalchemy
from sqlalchemy import MetaData, Table

from adya.db.utils import db_config



class db_connection:
    def start_conn(self):
        try:
            engine = sqlalchemy.create_engine(
                db_config.DB_DIALECT + "+" + db_config.DB_DRIVER + "://" + db_config.DB_USERNAME +
                ":" + db_config.DB_PASSWORD + '@' + db_config.DB_HOST + ":" + db_config.DB_PORT +
                "/" + db_config.DB_NAME)

            metadata = MetaData(bind=engine)




        except Exception as e:
            print e
            exit()

        return metadata




