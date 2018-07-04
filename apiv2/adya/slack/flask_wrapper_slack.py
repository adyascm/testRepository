from flask import request
from flask_restful import Resource
from adya.slack.services import actions_handler, notifications_handler, oauth_handler, scan_handler, \
    policy_validate_handler


class ExecuteSlackActions(Resource):
    def post(self):
        return actions_handler.execute_slack_actions(request, None)


class ProcessSlackNotifications(Resource):
    def post(self):
        return notifications_handler.receive_slack_notifications(request, None)


class slack_oauth_request(Resource):
    def get(self):
        return oauth_handler.slack_oauth_request(request, None)


class slack_oauth_callback(Resource):
    def get(self):
        return oauth_handler.slack_oauth_callback(request, None)


class SlackScan(Resource):
    def get(self):
        return scan_handler.start_scan(request, None)
    def post(self):
        return scan_handler.update_scan(request, None)


class SlackEntities(Resource):
    def get(self):
        return scan_handler.request_scanner_data(request, None)

    def post(self):
        return scan_handler.process_scanner_data(request, None)


class SlackPolicyValidator(Resource):
    def post(self):
        return policy_validate_handler.validate_policy(request, None)
