import utils
from adya.common.constants import constants
import aws_utils,sys
from slugify import slugify
from requests_futures.sessions import FuturesSession
from adya.common.response_messages import Logger

def send_push_notification(queue_name, string_payload):
    session = FuturesSession()
    push_message = {}
    push_message["AK"] = "QQztAk"
    push_message["PK"] = "WDcLMrV4LQgt"
    push_message["C"] = queue_name
    push_message["M"] = string_payload

    session.post(url=constants.REAL_TIME_URL, json=push_message)

def trigger_get_event(endpoint, auth_token, query_params, service_name="core"):
    if constants.DEPLOYMENT_ENV == 'local':
        session = FuturesSession()
        endpoint = _add_query_params_to_url(endpoint, query_params)
        Logger().info("Making a GET request on the following url - " + str(endpoint))
        utils.get_call_with_authorization_header(session, endpoint, auth_token)
    else:
        body = _add_query_params_to_body({}, query_params)
        endpoint = service_name + "-" + constants.DEPLOYMENT_ENV + "-get-"+ slugify(endpoint)
        Logger().info("Making a GET lambda invoke on the following function - " + str(endpoint))
        aws_utils.invoke_lambda(endpoint, auth_token, body)

def trigger_post_event(endpoint, auth_token, query_params, body, service_name="core"):
    print "trigger_post_event "
    if constants.DEPLOYMENT_ENV == 'local':
        session = FuturesSession()
        endpoint = _add_query_params_to_url(endpoint, query_params)
        Logger().info("Making a POST request on the following url - " + str(endpoint))
        utils.post_call_with_authorization_header(session, endpoint, auth_token, body)
    else:
        Logger().info("trigger_post_event : lambda ")
        body = _add_query_params_to_body(body, query_params)
        endpoint = service_name + "-" + constants.DEPLOYMENT_ENV + "-post-"+ slugify(endpoint)
        Logger().info("Making a POST lambda invoke on the following function - " + str(endpoint))
        aws_utils.invoke_lambda(endpoint, auth_token, body)

def trigger_delete_event(endpoint, auth_token, query_params, service_name="core"):
    if constants.DEPLOYMENT_ENV == 'local':
        session = FuturesSession()
        endpoint = _add_query_params_to_url(endpoint, query_params)
        Logger().info("Making a DELETE request on the following url - " + str(endpoint))
        utils.delete_call_with_authorization_header(session, endpoint, auth_token)
    else:
        body = _add_query_params_to_body({},query_params)
        endpoint = service_name + "-" + constants.DEPLOYMENT_ENV + "-delete-"+ slugify(endpoint)
        Logger().info("Making a DELETE lambda invoke on the following function - " + str(endpoint))
        aws_utils.invoke_lambda(endpoint, auth_token, body)

def _add_query_params_to_url(endpoint, query_params):
    query_string = ""
    if query_params:
        for qp in query_params.keys():
            query_string = query_string + qp + "=" + query_params[qp] + "&"
    if query_string:
        endpoint = endpoint + "?" + query_string[:-1]
    return endpoint

def _add_query_params_to_body(body, query_params):
    query_string = ""
    if query_params:
        for qp in query_params.keys():
            body[qp] = query_params[qp]
    return body