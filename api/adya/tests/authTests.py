import unittest
from api.adya.datasources.google import authProvider

class RegistrationTestCase(unittest.TestCase):
    def test_registration(self):
        self.assertNotEqual(authProvider.login_request(), "")

if __name__ == '__main__':
    unittest.main()