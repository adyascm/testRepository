from google.oauth2.credentials import Credentials
import googleapiclient.discovery as discovery
import json

GOOGLE_TOKEN_URI = 'https://www.googleapis.com/oauth2/v4/token'

def get_credentials():
    refreshToken = '1/O1Z_JasbbNERYReCtbl8Bqh--RvihQRewoCTnb43F7M'
    client_id = '675474472628-87uc3fnbmojup9ur2a1b9ie7qfd5i732.apps.googleusercontent.com'
    client_secret = '8DcZ_BxYCd8cBKKEoXdLwwdk'
    credentials = Credentials(None,refresh_token=refreshToken,
                              token_uri=GOOGLE_TOKEN_URI,
                              client_id=client_id,
                              client_secret=client_secret)
    return credentials

def get_gdrive_service():
    credentials = get_credentials()
    service = discovery.build('drive', 'v3', credentials=credentials)
    return service


def get_file_type_from_mimetype(mime_type):
    # replacing '/' with '.' and getting file type
    type = (mime_type.replace('/', '.')).rsplit('.', 1)[1]
    return type