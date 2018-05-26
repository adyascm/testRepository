from flask import request
from flask_restful import Resource

from adya.common.utils.request_session import RequestSession
from adya.slack.incremental_scan import process_notifications


class process_slack_notifications(Resource):
    def post(self):
        req_session = RequestSession(request)
        req_error = req_session.validate_authorized_request(False, mandatory_params=[], optional_params=[])
        if req_error:
            return req_error

        response = process_notifications(req_session.get_body())
        return req_session.generate_sqlalchemy_response(202, {"challenge": response})

