import os

API_HOST = os.environ.get('API_HOST', 'http://localhost:5000')
UI_HOST = os.environ.get('UI_HOST', 'http://localhost:3000')

DB_URL = os.environ.get('DB_URL', 'localhost:3306')
DB_USERNAME = os.environ.get('DB_USERNAME', 'root')
DB_PWD = os.environ.get('DB_PWD', 'root')
DB_NAME = os.environ.get('DB_NAME', 'adya')

GOOGLE_OAUTH_CALLBACK_URL = API_HOST + "/googleoauthcallback"
OAUTH_STATUS_URL = UI_HOST + "/oauthstatus"

NEXT_CALL_FROM_FILE_ID = 4*60
PROCESS_RESOURCES_URL = API_HOST + "/processresources"
GDRIVE_SCAN_URL = API_HOST + "/gdrivescan"
GET_PERMISSION_URL = API_HOST +"/permisssions"
