import utils
import constants
import aws_utils
from slugify import slugify
from requests_futures.sessions import FuturesSession

def trigger_get_event(endpoint, auth_token, query_params):
    if constants.DEPLOYMENT_ENV == 'local':
        session = FuturesSession()
        endpoint = _add_query_params_to_url(endpoint, query_params)
        print "Making a GET request on the following url - " + endpoint
        utils.get_call_with_authorization_header(session, endpoint, auth_token)
    else:
        body = _add_query_params_to_body({}, query_params)
        endpoint = constants.SERVERLESS_SERVICE_NAME + "-" + constants.DEPLOYMENT_ENV + "-get-"+ slugify(endpoint)
        print "Making a GET lambda invoke on the following function - " + endpoint
        aws_utils.invoke_lambda(endpoint, auth_token, body)

def trigger_post_event(endpoint, auth_token, query_params, body):
    if constants.DEPLOYMENT_ENV == 'local':
        session = FuturesSession()
        endpoint = _add_query_params_to_url(endpoint, query_params)
        print "Making a POST request on the following url - " + endpoint
        utils.post_call_with_authorization_header(session, endpoint, auth_token, body)
    else:
        body = _add_query_params_to_body(body, query_params)
        endpoint = constants.SERVERLESS_SERVICE_NAME + "-" + constants.DEPLOYMENT_ENV + "-post-"+ slugify(endpoint)
        print "Making a POST lambda invoke on the following function - " + endpoint
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