import json
from adya.common.constants import constants
import os
from adya.common.utils.response_messages import Logger

def get_call_with_authorization_header(session, url, auth_token):
    headers = {"Authorization": auth_token}
    if not url.startswith('http'):
        url = constants.API_HOST + url
    Logger().info("Making a GET request on the following url - " + url)
    return session.get(url=url, headers=headers)

def delete_call_with_authorization_header(session, url, auth_token, json):
    headers = {"Authorization": auth_token}
    if not url.startswith('http'):
        url = constants.API_HOST + url
    Logger().info("Making a DELETE request on the following url - " + url)
    return session.delete(url=url, json=json, headers=headers)


def post_call_with_authorization_header(session, url, auth_token, json):
    headers = {"Authorization": auth_token, "Content-Type": "application/json"}
    if not url.startswith('http'):
        url = constants.API_HOST + url
    Logger().info("Making a POST request on the following url - " + url)
    return session.post(url=url, json=json, headers=headers)

def update_call_with_authorization_header(session, url, auth_token, json):
    headers = {"Authorization": auth_token, "Content-Type": "application/json"}
    if not url.startswith('http'):
        url = constants.API_HOST + url
    print "Making a UPDATE request on the following url - " + url
    return session.put(url=url, json=json, headers=headers)


def get_role_type(role):
    role = role.lower()
    if role == "write":
        return constants.Role.WRITER
    elif role == "read":
        return constants.Role.READER
    elif role == "commenter":
        return constants.Role.COMMENTER
    elif role == "organizer":
        return constants.Role.ORGANIZER
    elif role == "owner":
        return constants.Role.OWNER


