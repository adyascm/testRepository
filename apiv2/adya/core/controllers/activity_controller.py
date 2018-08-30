from adya.common.db import activity_db
from adya.common.db.connection import db_connection
from adya.common.db.models import DataSource
from adya.common.constants import event_constants


def get_activites_for_domain(filters):
    page_number = int(filters.get('pageNumber')) if filters.get('pageNumber') else 0
    sort_column = filters.get('sortColumn') if filters.get('sortColumn') else "timestamp"
    filters = filters if filters else {}
    page_limit = filters.get('pageSize') if filters.get('pageSize') else 20
    sort_type = filters.get('sortOrder') if filters.get('sortOrder') else None
        
    cursor = activity_db.activity_db().get_activites_with_filter(filters, sort_column, sort_type, page_number, page_limit)
    activities = []
    for activity in cursor:
        activity['timestamp'] = str(activity['timestamp'])
        activity['_id'] = str(activity['_id'])
        activities.append(activity)

    return activities

def get_activity_event_types():
    events = {}
    event_types = event_constants.datasource_event_types_map
    for event_datasource,event_type in event_types.items():
        if event_datasource not in events:
            events[event_datasource] = {}
        for k,v in event_type.items():
            events[event_datasource][k] = v
    return events        




