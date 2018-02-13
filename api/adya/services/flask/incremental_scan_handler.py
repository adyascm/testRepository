from flask_restful import Resource,reqparse,request
from adya.datasources.google import incremental_scan
from adya.controllers import domain_controller
from adya.common.request_session import RequestSession
import json


class subscribe(Resource):
    def post(self):
        req_session = RequestSession(request)
        req_error = req_session.validate_authorized_request()
        if req_error:
            return req_error

        domain_id = req_session.get_req_param('domain_id')
        print "Subscribing push notifications for domain_id: ", domain_id
        incremental_scan.subscribe(domain_id)
        return req_session.generate_response(202, "Subscription successful")


class process_notifications(Resource):
    def post(self):
        req_session = RequestSession(request)
        req_error = req_session.validate_authorized_request(headers=['X-Goog-Channel-Token', 'X-Goog-Channel-ID'])
        if req_error:
            return req_error

        domain_id = req_session.get_req_header('X-Goog-Channel-Token')
        channel_id = req_session.get_req_header('X-Goog-Channel-ID')
        print "Processing notifications for ", domain_id, " on channel: ", channel_id
        incremental_scan.process_notifications(domain_id, channel_id)
        return req_session.generate_response(202, "Finished processing notifications. ")


class trigger_process_notifications(Resource):
    def get(self):
        req_session = RequestSession(request)
        req_error = req_session.validate_authorized_request()
        if req_error:
            return req_error

        auth_token = req_session.get_auth_token()
        print auth_token
        data_source = domain_controller.get_datasource(auth_token, None)

        print data_source
        domain_id = data_source[0].domain_id
        print "Processing notifications for ", domain_id, " on channel: ", auth_token
        incremental_scan.subscribe(domain_id, auth_token)
        incremental_scan.process_notifications(domain_id, auth_token)
        return req_session.generate_response(202, "Finished processing notifications. ")
