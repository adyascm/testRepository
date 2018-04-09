from flask_restful import Resource,request
from adya.gsuite import incremental_scan
from adya.common.utils.request_session import RequestSession


class subscribe(Resource):
    def post(self):
        req_session = RequestSession(request)
        req_error = req_session.validate_authorized_request(True, ["domainId", "dataSourceId"])
        if req_error:
            return req_error

        incremental_scan.subscribe(req_session.get_req_param('domainId'), req_session.get_req_param('dataSourceId'))
        return req_session.generate_response(202, "Subscription successful")


class process_notifications(Resource):
    def post(self):
        req_session = RequestSession(request)
        req_error = req_session.validate_authorized_request(headers=['X-Goog-Channel-Token', 'X-Goog-Channel-ID'])
        if req_error:
            return req_error

        datasource_id = req_session.get_req_header('X-Goog-Channel-Token')
        channel_id = req_session.get_req_header('X-Goog-Channel-ID')
        print "Processing notifications for ", datasource_id, " on channel: ", channel_id
        incremental_scan.process_notifications(datasource_id, channel_id)
        return req_session.generate_response(202, "Finished processing notifications. ")


class handle_channel_expiration(Resource):
    def get(self):
        req_session = RequestSession(request)
        req_error = req_session.validate_authorized_request(False)
        if req_error:
            return req_error

        response = incremental_scan.handle_channel_expiration()
        return req_session.generate_response(202, response)

