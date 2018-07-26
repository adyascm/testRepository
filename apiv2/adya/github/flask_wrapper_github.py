from flask import request
from flask_restful import Resource
from adya.github.services import oauth_handler, scan_handler, notifications_handler, actions_handler

class github_oauth_request(Resource):
    def get(self):
        return oauth_handler.github_oauth_request(request, None)

class github_oauth_callback(Resource):
    def get(self):
        return oauth_handler.github_oauth_callback(request, None)

# class GithubScan(Resource):
#     def post(self):
#         return scan_handler.start_github_scan(request, None)

# class GithubScanUsers(Resource):
#     def get(self):
#         return scan_handler.get_github_users(request, None)

#     def post(self):
#         return scan_handler.process_github_users(request, None)

# class GithubScanRepository(Resource):
#     def post(self):
#         return scan_handler.process_github_repository(request, None)

class GithubEntities(Resource):
    def get(self):
        scan_handler.request_scanner_data(request, None)
    def post(self):
        scan_handler.process_scanner_data(request, None)

class GithubScanUpdate(Resource):
    def get(self):
        scan_handler.start_scan(request, None)
    def post(self):
        scan_handler.update_scan(request, None)

class ProcessGithubNotifications(Resource):
    def post(self):
        notifications_handler.receive_github_notifications(request, None)

class ExecuteGithubActions(Resource):
    def post(self):
        actions_handler.execute_github_actions(request, None)