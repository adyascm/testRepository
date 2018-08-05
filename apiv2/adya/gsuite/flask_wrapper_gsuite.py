from flask import request
from flask_restful import Resource
from adya.gsuite.services import actions_handler, activities_handler, oauth_handler, policy_validate_handler, scan_handler

class ExecuteActions(Resource):
    def post(self):
        return actions_handler.execute_gsuite_actions(request, None)

class get_activities_for_user(Resource):
    def get(self):
        return activities_handler.get_activities_for_user(request, None)

class google_oauth_request(Resource):
    def get(self):
        return oauth_handler.google_oauth_request(request, None)

class google_oauth_callback(Resource):
    def get(self):
        return oauth_handler.google_oauth_callback(request, None)
    
class PolicyValidator(Resource):
    def post(self):
        return policy_validate_handler.validate_policy(request, None)

class GSuiteScan(Resource):
    def get(self):
        return scan_handler.start_scan(request, None)
    def post(self):
        return scan_handler.update_scan(request, None)

class GSuiteEntities(Resource):
    def get(self):
        return scan_handler.request_scanner_data(request, None)

class subscribe(Resource):
    def post(self):
        return scan_handler.subscribe_gdrive_notifications(request, None)

class process_drive_notifications(Resource):
    def post(self):
        return scan_handler.process_drive_change_notifications(request, None)

class process_activity_notifications(Resource):
    def post(self):
        return scan_handler.process_activity_notifications(request, None)

class handle_channel_expiration(Resource):
    def get(self):
        return scan_handler.handle_channel_expiration(request, None)

class PollChanges(Resource):
    def get(self):
        return scan_handler.gdrive_periodic_changes_poll(request, None)


