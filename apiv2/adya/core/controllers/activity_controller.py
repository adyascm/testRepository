from adya.common.db import activity_db
from adya.common.db.connection import db_connection
from adya.common.db.models import DataSource


def get_activites_for_domain(filters):
    page_number = int(filters.get('pageNumber')) if filters.get('pageNumber') else 0
    sort_column = filters.get('sortColumn') if filters.get('sortColumn') else "timestamp"
    filters = filters if filters else {}
    page_limit = filters.get('pageSize') if filters.get('pageSize') else 20
    sort_type = filters.get('sortType') if filters.get('sortType') else None

    cursor = activity_db.activity_db().get_activites_with_filter(filters, sort_column, sort_type, page_number, page_limit)
    activities = []
    for activity in cursor:
        activity['timestamp'] = str(activity['timestamp'])
        activity['_id'] = str(activity['_id'])
        activities.append(activity)

    return activities





