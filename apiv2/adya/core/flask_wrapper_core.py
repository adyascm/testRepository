from flask import request
from flask_restful import Resource
from adya.core.services import actions_handler, alert_handler, auditlog_handler, auth_handler, domain_handler, \
    policy_handler, reports_handler, directory_handler, resource_handler, app_handler, activity_handler


class get_all_actions(Resource):
    def get(self):
        return actions_handler.get_all_actions(request, None)


class initiate_action(Resource):
    def post(self):
        return actions_handler.initiate_action(request, None)


class Alert(Resource):
    def get(self):
        return alert_handler.get_alert(request, None)

    def post(self):
        return alert_handler.post_alert(request, None)


class AlertsCount(Resource):
    def get(self):
        return alert_handler.get_alert_count(request, None)


class get_audit_log(Resource):
    def get(self):
        return auditlog_handler.get_audit_log(request, None)


class get_user_session(Resource):
    def get(self):
        return auth_handler.current_user(request, None)


class datasource(Resource):
    def get(self):
        return domain_handler.get_datasource(request, None)

    def post(self):
        return domain_handler.post_datasource(request, None)

    def delete(self):
        return domain_handler.delete_datasource(request, None)


class asyncdatasourcedelete(Resource):
    def delete(self):
        return domain_handler.async_datasource_delete(request, None)


class TrustedEntities(Resource):
    def post(self):
        return domain_handler.post_trusted_entities(request, None)

    def get(self):
        return domain_handler.get_trusted_entities(request, None)


class Policy(Resource):
    def get(self):
        return policy_handler.get_policies(request, None)

    def post(self):
        return policy_handler.post_policy(request, None)

    def delete(self):
        return policy_handler.delete_policy(request, None)

    def put(self):
        return policy_handler.update_policy(request, None)


class DashboardWidget(Resource):
    def post(self):
        return reports_handler.get_widget_data(request, None)


class ScheduledReport(Resource):
    def post(self):
        return reports_handler.post_scheduled_report(request, None)

    def get(self):
        return reports_handler.get_scheduled_reports(request, None)

    def delete(self):
        return reports_handler.delete_scheduled_report(request, None)

    def put(self):
        return reports_handler.modify_scheduled_report(request, None)


class RunReport(Resource):
    def get(self):
        return reports_handler.run_scheduled_report(request, None)


class UserStats(Resource):
    def get(self):
        return directory_handler.get_user_stats(request, None)


class UsersList(Resource):
    def get(self):
        return directory_handler.get_users_list(request, None)


class GroupMembers(Resource):
    def get(self):
        return directory_handler.get_group_members(request, None)


class AppStats(Resource):
    def get(self):
        return app_handler.get_app_stats(request, None)


class UserApps(Resource):
    def get(self):
        return app_handler.get_user_app(request, None)

    def post(self):
        return app_handler.post_user_app(request, None)

    def put(self):
        return app_handler.modify_user_app(request, None)


class GetResources(Resource):
    def get(self):
        return resource_handler.get_resources(request, None)

    def post(self):
        return resource_handler.get_resource_tree_data(request, None)

class ResourcesExport(Resource):
    def post(self):
        return resource_handler.export_to_csv(request, None)

class UsersExport(Resource):
    def post(self):
        return directory_handler.export_to_csv(request, None)

class Activities(Resource):
    def post(self):
        return activity_handler.get_all_activities(request, None)

class DefaultReportPolicy(Resource):
    def post(self):
        return domain_handler.default_report_policy(request, None)       

class get_all_activity_events(Resource):
    def get(self):
        return activity_handler.get_all_activity_events(request, None)


