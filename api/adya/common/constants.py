import os

API_HOST = os.environ.get('API_HOST', 'http://localhost:5000')
REDIRECT_STATUS = os.environ.get('REDIRECT_STATUS', 'http://localhost:3000/success')

DB_URL = os.environ.get('DB_URL', 'localhost:3306')
DB_USERNAME = os.environ.get('DB_USERNAME', 'root')
DB_PWD = os.environ.get('DB_PWD', 'root')
DB_NAME = os.environ.get('DB_NAME', 'adya')

