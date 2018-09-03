
from adya.common.db.models import Resource, ResourcePermission, DomainUser
from adya.common.constants import constants
from adya.github import github_utils
from datetime import datetime

class GithubRepository:
    def __init__(self, datasource_id, payload, owner_email):
        self._datasource_id = datasource_id
        self._payload = payload
        self._owner_email = owner_email
        self._repo = None
        self.parse()

    def parse(self):
        #Parse the payload received
        self._repo = Resource()
        self._repo.datasource_id = self._datasource_id
        self._repo.resource_id = self._payload["id"]
        self._repo.resource_name = self._payload["full_name"]
        self._repo.resource_size = self._payload["size"]
        self._repo.creation_time = self._payload["created_at"]
        self._repo.last_modified_time = self._payload["pushed_at"]
        self._repo.description = self._payload["description"]
        self._repo.parent_id = self._payload["parent"]["id"] if self._payload["fork"] else None
        owner_email = "{0}+{1}@users.noreply.github.com".format(self._payload["owner"]["id"], self._payload["owner"]["login"])
        self._repo.resource_owner_id = self._owner_email
        self._repo.exposure_type = constants.EntityExposureType.PRIVATE.value if self._payload["private"] else constants.EntityExposureType.PUBLIC.value
        self._repo.permissions = []
        permission = GithubRepositoryPermission(self._datasource_id, self._payload, self._owner_email)
        permission_model = permission.get_model()
        if permission_model:
            self._repo.permissions.append(permission_model)

    def get_model(self):
        return self._repo

class GithubRepositoryPermission:
    def __init__(self, datasource_id, payload, owner_email):
        self._datasource_id = datasource_id
        self._payload = payload
        self._owner_email = owner_email
        self._repo_permission = None
        self.parse()

    def parse(self):
        #Parse payload and generate repository permission object
        self._repo_permission = ResourcePermission()
        self._repo_permission.datasource_id = self._datasource_id
        self._repo_permission.resource_id = self._payload["id"]
        owner_email = "{0}+{1}@users.noreply.github.com".format(self._payload["owner"]["id"], self._payload["owner"]["login"])
        self._repo_permission.email = self._owner_email
        self._repo_permission.permission_id = self._payload["owner"]["id"]
        self._repo_permission.exposure_type = constants.EntityExposureType.PRIVATE.value if self._payload["private"] else constants.EntityExposureType.PUBLIC.value

        if "permissions" in self._payload:
            permissions = self._payload["permissions"]
            if permissions["admin"]:
                self._repo_permission.permission_type = constants.Role.ADMIN.value
            elif permissions["push"]:
                self._repo_permission.permission_type = constants.Role.WRITER.value
            else:
                self._repo_permission.permission_type = constants.Role.READER.value
        else:
            self._repo_permission.permission_type = constants.Role.READER.value

    def get_model(self):
        return self._repo_permission

class GithubUser:
    def __init__(self, datasource_id, domain_id, payload):
        self._datasource_id = datasource_id
        self._domain_id = domain_id
        self._payload = payload
        self._user = None
        self._parse()
    
    def _parse(self):
        self._user = DomainUser()
        self._user.datasource_id = self._datasource_id
        self._user.full_name = self._payload["name"] if self._payload["name"] else self._payload["login"]
        name_split = self._user.full_name.split(" ")
        if len(name_split) > 1:
            self._user.first_name = name_split[0]
            self._user.last_name = name_split[1]
        else:
            self._user.first_name = name_split[0]
            self._user.last_name = ''
        self._user.email = self._payload["email"] if self._payload["email"] else github_utils.get_default_github_email(self._payload["id"], self._payload["login"])
        self._user.creation_time = datetime.strptime(self._payload["created_at"], "%Y-%m-%dT%H:%M:%SZ")
        self._user.last_updated = datetime.strptime(self._payload["updated_at"], "%Y-%m-%dT%H:%M:%SZ")
        self._user.photo_url = self._payload["avatar_url"]
        self._user.user_id = self._payload["id"]
        self._user.member_type = constants.EntityExposureType.INTERNAL.value
        
        if github_utils.is_external_user(self._domain_id, self._user["email"]):
            self._user.member_type = constants.EntityExposureType.EXTERNAL.value

    def get_model(self):
        return self._user

