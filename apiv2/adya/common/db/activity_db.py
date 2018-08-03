import datetime

import pymongo
from pymongo import MongoClient
from adya.common.constants import constants


class activity_db:
    class __activity_db:
        _client = None
        _db = None

        def __init__(self):
            if not self._client:
                self._client = MongoClient(constants.ACTIVITY_DB_HOST, int(constants.ACTIVITY_DB_PORT))
            if not self._db:
                self._db = self._client[constants.DEPLOYMENT_ENV + "_activities"]

        def get_db(self):
            return self._db

        def get_collection(self, collection_name):
            if self._db:
                return self._db[collection_name]
            else:
                return None

    instance = None

    def __init__(self):
        if not activity_db.instance:
            activity_db.instance = activity_db.__activity_db()

    def __getattr__(self, name):
        return getattr(self.instance, name)

    def add_event(self, domain_id, connector_type, event_type, actor, tags):
        event_collection = activity_db.instance.get_collection("events")
        insert_payload = {"domain_id": domain_id, "connector_type": connector_type,
                          "event_type": event_type, "actor": actor, "timestamp": datetime.datetime.utcnow()}
        if len(tags) > 0:
            insert_payload.update(tags)
        event_collection.insert_one(insert_payload)

    def get_event_stats(self, filters, sort_column, sort_type):
        event_collection = activity_db.instance.get_collection("events")
        filter_query = generate_filter_query(filters)
        sort_query = {}
        if sort_column and sort_type:
            sort_query = {sort_column: pymongo.ASCENDING if sort_type == "asc" else pymongo.DESCENDING}
        pipeline = [
            {"$match": filter_query},
            {"$group": {
                "_id": {
                    "event_type": "$event_type",
                    "year": {"$year": "$timestamp"},
                    "month": {"$month": "$timestamp"},
                    "day": {"$dayOfMonth": "$timestamp"},
                    "hour": {
                        "$subtract": [
                            {"$hour": "$timestamp"},
                            {"$mod": [{"$hour": "$timestamp"}, 24]}
                        ]
                    }
                },
                "count": {"$sum": 1}
            }},
            {"$project": {
                "_id": 0,
                "event_type": "$_id.event_type",
                "year": "$_id.year",
                "month": "$_id.month",
                "day": "$_id.day",
                "count": "$count"

            }},
            {"$sort": sort_query}
        ]
        activities = event_collection.aggregate(pipeline)
        # return json.loads(json_util.dumps(activities))
        return activities

    def get_activites_with_filter(self, filters, sort_column, sort_type, page_number, page_limit=1):
        event_collection = activity_db.instance.get_collection("events")
        query_filter = generate_filter_query(filters)
        activities = event_collection.find(filter=query_filter, skip=(page_number * page_limit), limit=page_limit)
        if sort_column and sort_type:
            activities = activities.sort(sort_column, pymongo.ASCENDING if sort_type == "asc" else pymongo.DESCENDING)
        return activities


def generate_filter_query(filters):
    query_filter = {}
    if filters.get("domain_id"):
        query_filter["domain_id"] = filters.get("domain_id")
    if filters.get("actor"):
        query_filter["actor"] = {"$regex": "^{}".format(filters.get("actor"))}
    if filters.get("connector_type"):
        query_filter["connector_type"] = {"$regex": "^{}".format(filters.get("connector_type"))}
    if filters.get("event_type"):
        query_filter["event_type"] = filters.get("event_type")
    if filters.get("timestamp"):
        query_filter["timestamp"] = {"$gte": datetime.datetime.strptime(filters.get("timestamp"), '%Y-%m-%d %H:%M:%S')}

    return query_filter
