
from adya.common.db.models import Resource, ResourcePermission
from adya.common.constants import constants

class GithubRepository:
    def __init__(self, datasource_id, payload):
        self._datasource_id = datasource_id
        self._payload = payload
        self._repo = None
        self.parse()

    def parse(self):
        #Parse the payload received
        self._repo = Resource()
        self._repo["datasource_id"] = self._datasource_id
        self._repo["resource_id"] = self._payload["id"]
        self._repo["resource_name"] = self._payload["full_name"]
        self._repo["resource_size"] = self._payload["size"]
        self._repo["creation_time"] = self._payload["created_at"]
        self._repo["last_modified_time"] = self._payload["pushed_at"]
        self._repo["description"] = self._payload["description"]
        self._repo["parent_id"] = self._payload["parent"]["id"] if self._payload["fork"] else None
        owner_email = "{0}+{1}@users.noreply.github.com".format(self._payload["owner"]["id"], self._payload["owner"]["login"])
        self._repo["resource_owner_id"] = owner_email
        self._repo["exposure_type"] = constants.EntityExposureType.PRIVATE.value if self._payload["private"] else constants.EntityExposureType.PUBLIC.value

    def get_model(self):
        return self._repo

class GithubRepositoryPermission:
    def __init__(self, datasource_id, payload):
        self._datasource_id = datasource_id
        self._payload = payload
        self._repo_permission = None
        self.parse()

    def parse(self):
        #Parse payload and generate repository permission object
        self._repo_permission = ResourcePermission()
        self._repo_permission["datasource_id"] = self._datasource_id
        self._repo_permission["resource_id"] = self._payload["id"]
        owner_email = "{0}+{1}@users.noreply.github.com".format(self._payload["owner"]["id"], self._payload["owner"]["login"])
        self._repo_permission["email"] = owner_email
        self._repo_permission["permission_id"] = self._payload["owner"]["id"]
        self._repo_permission["exposure_type"] = constants.EntityExposureType.PRIVATE.value if self._payload["private"] else constants.EntityExposureType.PUBLIC.value

        if self._payload["permissions"]:
            permissions = self._payload["permissions"]
            if permissions["admin"]:
                self._repo_permission["permission_type"] = constants.Role.ADMIN.value
            elif permissions["push"]:
                self._repo_permission["permission_type"] = constants.Role.WRITER.value
            else:
                self._repo_permission["permission_type"] = constants.Role.READER.value

    def get_model(self):
        return self._repo_permission
