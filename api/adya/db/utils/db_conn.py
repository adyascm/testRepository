import sqlalchemy
from sqlalchemy import MetaData, Table

from api.adya.db.utils import db_config
from api.flaskapp import app


class db_connection:
    def start_conn(self):
        try:
            engine = sqlalchemy.create_engine(
                db_config.DB_DIALECT + "+" + db_config.DB_DRIVER + "://" + db_config.DB_USERNAME +
                ":" + db_config.DB_PASSWORD + '@' + db_config.DB_HOST + ":" + db_config.DB_PORT +
                "/" + db_config.DB_NAME)

            metadata = MetaData(bind=engine)



        except:
            app.logger.error("Error:  Could not connect to MySql instance")
            exit()

        return metadata

    def end_conn(self, connection):
        if connection:
            connection.close()


conn = db_connection()
conn.start_conn()
