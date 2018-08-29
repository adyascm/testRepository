from adya.common.constants import constants
from adya.common.constants.constants import ConnectorTypes

default_reports = [
    {"name":"System::Inactive Users Report", "description":"Users who have been inactive for more than 90 days","domain_id" :"","frequency":constants.CronExp.MONTHLY.value, "report_type":constants.ReportType.INACTIVE.value, "selected_entity":"",
    "selected_entity_type":"","selected_entity_name":"","is_active":False},
    {"name":"System::External Users Report", "description":"External Users who have access to domain resources","domain_id" :"","frequency":constants.CronExp.MONTHLY.value, "report_type":constants.ReportType.EXTERNALUSERS.value, "selected_entity":"",
    "selected_entity_type":"","selected_entity_name":"","is_active":False},
    {"name":"System::Admin Users Report", "description":"Users who have admin access","domain_id" :"","frequency":constants.CronExp.MONTHLY.value, "report_type":constants.ReportType.ADMIN.value, "selected_entity":"",
    "selected_entity_type":"","selected_entity_name":"","is_active":False},
    {"name":"System::Exposed Resources Report", "description":"Resources which have been exposed externally","domain_id" :"","frequency":constants.CronExp.MONTHLY.value, "report_type":constants.ReportType.EXPOSEDRESOURCES.value, "selected_entity":"",
    "selected_entity_type":"","selected_entity_name":"","is_active":False},
    {"name":"Weekly summary", "description":"Weekly summary report","domain_id" :"","frequency":constants.CronExp.WEEKLY.value, "report_type":constants.ReportType.WEEKLYSUMMARY.value, "selected_entity":"",
        "selected_entity_type":"","selected_entity_name":"","is_active":False}
]
default_reports_gsuite = [
    {"name":"GSuite::Empty Google Groups", "description":"Groups having 0 member","domain_id" :"","frequency":constants.CronExp.MONTHLY.value, "report_type":constants.ReportType.EMPTYGSUITEGROUP.value, "selected_entity":"",
    "selected_entity_type":"","selected_entity_name":"","is_active":False},
]
default_reports_slack = [
    {"name":"Slack::Empty Slack Channels", "description":"Channels having 0 member","domain_id" :"","frequency":constants.CronExp.MONTHLY.value, "report_type":constants.ReportType.EMPTYSLACKCHANNEL.value, "selected_entity":"",
    "selected_entity_type":"","selected_entity_name":"","is_active":False},
]


datasource_to_default_report_map = {
    ConnectorTypes.SLACK.value: default_reports_slack,
    ConnectorTypes.GSUITE.value: default_reports_gsuite
}