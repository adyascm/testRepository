import unittest
from ..datasources.google import authProvider

class RegistrationTestCase(unittest.TestCase):
    def test_registration(self):
        self.assertEqual(authProvider.login("amit","amit","abc123"),{"email":"amit"})

if __name__ == '__main__':
    unittest.main()