import datetime, json
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
        if len(tags)> 0:
            insert_payload.update(tags)
        event_collection.insert_one(insert_payload)

    def get_event_stats(self, domain_id, connector_type, event_type, actor, tags):
        event_collection = activity_db.instance.get_collection("events")
        pipeline = [
            { "$group": {
                    "_id": {
                        "event_type": "$event_type" ,
                        "year": { "$year": "$timestamp" },
                        "month": { "$month": "$timestamp" },
                        "day": { "$dayOfMonth": "$timestamp" },
                        "hour": {
                            "$subtract": [
                                { "$hour": "$timestamp" },
                                { "$mod": [ { "$hour": "$timestamp" }, 24 ] }
                            ]
                        }
                    },
                    "count": { "$sum": 1 }
            }},
            {"$project": {
                "_id": 0,
                "event_type": "$_id.event_type",
                "year": "$_id.year",
                "month": "$_id.month",
                "day": "$_id.day",
                "count": "$count"
                
            }}
        ]
        activities = event_collection.aggregate(pipeline)
        #return json.loads(json_util.dumps(activities))
        return activities




