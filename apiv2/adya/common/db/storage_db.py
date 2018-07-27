import datetime, json
import pymongo
from bson import json_util
from bson.son import SON
from slugify import slugify
from adya.common.constants import constants

class storage_db:
    class __storage_db:
        _client = None
        _db = {}
        def __init__(self):
            if not self._client:
                self._client = pymongo.MongoClient(constants.STORAGE_DB_HOST, int(constants.STORAGE_DB_PORT))
        
        def get_db(self, domain_id):
            if not domain_id in self._db:
                self._db[domain_id] = self._client[constants.DEPLOYMENT_ENV + "_" + slugify(domain_id)]
                #Create indexes
                self._db[domain_id]["resources"].create_index([("datasource_id", pymongo.ASCENDING), ("resource_id", pymongo.ASCENDING)])
                self._db[domain_id]["permissions"].create_index([("datasource_id", pymongo.ASCENDING), ("resource_id", pymongo.ASCENDING), ("email", pymongo.ASCENDING)])
            return self._db[domain_id]
        def get_collection(self, domain_id, collection_name):
                return self.get_db(domain_id)[collection_name]


    instance = None
    def __init__(self):
        if not storage_db.instance:
            storage_db.instance = storage_db.__storage_db()
    def __getattr__(self, name):
        return getattr(self.instance, name)

    def add_resources(self, domain_id, resources):
        resources_collection = storage_db.instance.get_collection(domain_id, "resources")
        resources_collection.insert_many(resources)

    def get_resources(self, domain_id, input_filters, sort_column, sort_type, page_number, page_limit, fields=None):
        resources_collection = storage_db.instance.get_collection(domain_id, "resources")

        filters = {}
        if input_filters.get("datasourceId"):
            filters["datasource_id"] = {"$in": input_filters.get("datasourceId")}
        if input_filters.get("selectedDate"):
            filters["last_modified_time"] = {"$lt": input_filters.get("selectedDate")}
        if input_filters.get("ownerEmailId"):
            filters["resource_owner_id"] = { "$regex": "^{}".format(input_filters.get("ownerEmailId")) }
        if input_filters.get("resourceType"):
            filters["resource_type"] = input_filters.get("resourceType")
        if input_filters.get("exposureType"):
            filters["exposure_type"] = input_filters.get("exposureType")
        if input_filters.get("prefix"):
            filters["resource_name"] = { "$regex": "^{}".format(input_filters.get("prefix")) }
        if input_filters.get("accessibleBy"):
            filters["shared_with"] = input_filters.get("accessibleBy")
        
        resources = resources_collection.find(filter=filters, projection=fields, skip=(page_number*page_limit), limit=page_limit)
        if sort_column and sort_type:
            resources = resources.sort(sort_column, pymongo.ASCENDING if sort_type == "asc" else pymongo.DESCENDING)
        return json.loads(json_util.dumps(resources))

    def get_resources_stat(self, domain_id, input_filters, group_field, page_limit=None, unwind=False):
        resources_collection = storage_db.instance.get_collection(domain_id, "resources")

        filters = {}
        if input_filters.get("datasourceId"):
            filters["datasource_id"] = {"$in": input_filters.get("datasourceId")}
        if input_filters.get("ownerEmailId"):
            filters["resource_owner_id"] = { "$regex": "^{}".format(input_filters.get("ownerEmailId")) }
        if input_filters.get("resourceType"):
            filters["resource_type"] = input_filters.get("resourceType")
        if input_filters.get("exposureType"):
            filters["exposure_type"] = {"$in": input_filters.get("exposureType")}
        if input_filters.get("accessibleBy"):
            filters["shared_with"] = input_filters.get("accessibleBy")
        
        pipeline = []
        if unwind:
            pipeline.append({"$unwind": "$" + group_field})
        pipeline.append({"$match": filters})
        pipeline.append({"$group": {"_id": "$" + group_field, "count": {"$sum": 1}}})
        pipeline.append({"$sort": SON([("count", -1)])})

        if page_limit:
            pipeline.append({"$limit": page_limit})
        resources = resources_collection.aggregate(pipeline)
        return json.loads(json_util.dumps(resources))

    def add_permissions(self, domain_id, permissions):
        permissions_collection = storage_db.instance.get_collection(domain_id, "permissions")
        permissions_collection.insert_many(permissions)
