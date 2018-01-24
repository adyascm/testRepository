import unittest

import datetime

from adya.datasources.google import authProvider
from adya.db.db_conn import db_connection
from adya.db.dbschema.models import Account

#Testing jenkins trigger
class RegistrationTestCase(unittest.TestCase):
    def test_simple_dbcall(self):
        session = db_connection().get_session()
        session.add(Account(domain_id='Test1', domain_name='TestName', create_time=datetime.datetime.now()))
        session.commit()
        accounts = session.query(Account)

if __name__ == '__main__':
    unittest.main()