default_reports = [
    {"name":"System::Inactive Users Report", "description":"Users who have been inactive for more than 90 days","domain_id" :"","frequency":"cron(0 10 1 * ? *)", "report_type":"Inactive", "selected_entity":"",
    "selected_entity_type":"","selected_entity_name":"","is_active":False},
    {"name":"System::External Users Report", "description":"External Users who have access to domain resources","domain_id" :"","frequency":"cron(0 10 1 * ? *)", "report_type":"External", "selected_entity":"",
    "selected_entity_type":"","selected_entity_name":"","is_active":False},
    {"name":"System::Admin Users Report", "description":"Users who have admin access","domain_id" :"","frequency":"cron(0 10 1 * ? *)", "report_type":"Admin", "selected_entity":"",
    "selected_entity_type":"","selected_entity_name":"","is_active":False},
]
default_reports_gsuite = [
    {"name":"GSuite::Empty Google Groups", "description":"Groups having 0 member","domain_id" :"","frequency":"cron(0 10 1 * ? *)", "report_type":"EmptyGSuiteGroup", "selected_entity":"",
    "selected_entity_type":"","selected_entity_name":"","is_active":False},
]
default_reports_slack = [
    {"name":"Slack::Empty Slack Channels", "description":"Channels having 0 member","domain_id" :"","frequency":"cron(0 10 1 * ? *)", "report_type":"EmptySlackChannel", "selected_entity":"",
    "selected_entity_type":"","selected_entity_name":"","is_active":False},
]
