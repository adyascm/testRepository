import json
from adya.db.models import AlchemyEncoder

def post_call_with_authorization_header(session,url,auth_token,data):
    headers = {"Authorization":auth_token}
    session.post(url=url,data=json.dumps(data),headers=headers)

def get_response_json(data):
    return json.dumps(data,cls=AlchemyEncoder)