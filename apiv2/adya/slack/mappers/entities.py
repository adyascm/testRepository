import datetime
import json

from adya.common.constants import constants
from adya.common.db.connection import db_connection
from adya.common.db.models import DomainUser, Resource, ResourcePermission, DirectoryStructure, Application, \
    ApplicationUserAssociation, AppInventory
from adya.common.utils import utils
from adya.common.utils.utils import get_trusted_entity_for_domain
from adya.slack import slack_utils


class SlackUser:
    def __init__(self, domain_id, datasource_id, payload):
        self._domain_id = domain_id
        self._datasource_id = datasource_id
        self._payload = payload
        self._user = None
        self.parse()

    def parse(self):
        self._user = DomainUser()
        profile_info = self._payload['profile']
        self._user.datasource_id = self._datasource_id
        if 'email' in profile_info:
            self._user.email = profile_info['email']
        else:
            self._user.email = self._payload['name']

        full_name = profile_info['real_name']
        name_list = full_name.split(" ")
        self._user.first_name = name_list[0]
        self._user.last_name = name_list[1] if len(name_list) > 1 else None
        self._user.full_name = full_name
        self._user.user_id = self._payload['id']
        if 'is_admin' in self._payload:
            self._user.is_admin = self._payload['is_admin']
        self._user.is_suspended = self._payload['deleted']
        self._user.creation_time = datetime.datetime.fromtimestamp(self._payload['updated'])
        # check for user type

        db_session = db_connection().get_session()
        exposure_type = utils.check_if_external_user(db_session, self._domain_id, self._user.email)
        self._user.member_type = exposure_type
        self._user.type = constants.DirectoryEntityType.USER.value
        if self._payload['is_bot']:
            self._user.type = constants.DirectoryEntityType.BOT.value

    def get_model(self):
        return self._user


class SlackFile:
    def __init__(self, datasource_id, payload):
        self._datasource_id = datasource_id
        self._payload = payload
        self._file = None
        self.parse()

    def parse(self):
        self._file = Resource()
        self._file.datasource_id = self._datasource_id
        self._file.resource_id = self._payload['id']
        self._file.resource_name = self._payload['name']
        self._file.resource_type = self._payload['filetype']
        self._file.resource_size = self._payload['size']
        self._file.resource_owner_id = self._payload['resource_owner_email']
        self._file.creation_time = datetime.datetime.fromtimestamp(self._payload['timestamp'])
        self._file.last_modified_time = datetime.datetime.fromtimestamp(self._payload['timestamp'])
        self._file.web_content_link = self._payload[
            'url_private_download'] if 'url_private_download' in self._payload else None
        self._file.web_view_link = self._payload['url_private'] if 'url_private' in self._payload else None

        file_exposure_type = constants.EntityExposureType.ANYONEWITHLINK.value if self._payload['public_url_shared'] \
            else (constants.EntityExposureType.DOMAIN.value if self._payload['is_public'] else
                  constants.EntityExposureType.PRIVATE.value)

        is_editable = self._payload["editable"]

        db_session = db_connection().get_session()
        # construct user_info map for checking for removed users from channels
        existing_users = db_session.query(DomainUser).filter(DomainUser.datasource_id == self._datasource_id).all()
        user_info_map = {}
        for user in existing_users:
            user_info_map[user.user_id] = user

        self._file.permissions = []
        permission_exposure = constants.EntityExposureType.PRIVATE.value
        shared_in_channels = self._payload['channels']
        if shared_in_channels:
            permission_exposure_type = constants.EntityExposureType.DOMAIN.value
            for channel_id in shared_in_channels:
                permission = SlackPermission(self._datasource_id, user_info_map, is_editable, channel_id,
                                             permission_exposure_type, self._payload)
                permission_model = permission.get_model()
                if not permission_model:
                    continue
                self._file.permissions.append(permission_model)

                permission_exposure = constants.EntityExposureType.EXTERNAL.value if \
                    permission.get_permission_exposure_is_external() else permission_exposure_type

        shared_in_private_group = self._payload['groups']
        if shared_in_private_group:
            permission_exposure_type = constants.EntityExposureType.INTERNAL.value
            for group_id in shared_in_private_group:
                permission = SlackPermission(self._datasource_id, user_info_map, is_editable, group_id,
                                             permission_exposure_type, self._payload)

                permission_model = permission.get_model()
                if not permission_model:
                    continue
                self._file.permissions.append(permission_model)

                permission_exposure = constants.EntityExposureType.EXTERNAL.value if \
                    permission.get_permission_exposure_is_external() else permission_exposure_type

        if file_exposure_type == constants.EntityExposureType.ANYONEWITHLINK.value:
            permission = SlackPermission(self._datasource_id, user_info_map, is_editable, file_exposure_type,
                                         file_exposure_type, self._payload)

            permission_model = permission.get_model()
            if permission_model:
                self._file.permissions.append(permission_model)

        resource_exposure_type = utils.get_highest_exposure_type(permission_exposure, file_exposure_type)
        self._file.exposure_type = resource_exposure_type

    def get_model(self):
        return self._file


class SlackPermission:
    def __init__(self, datasource_id, user_info_map, is_editable, shared_id, permission_exposure_type, payload):
        self._datasource_id = datasource_id
        self._resource_id = payload['id']
        self._resource_owner = payload['resource_owner_email']
        self._payload = payload
        self._user_info_map = user_info_map
        self._is_editable = is_editable
        self._shared_id = shared_id
        self._permission_exposure_type = permission_exposure_type
        self._external_perms_exposure = None
        self._permission = None
        self.parse()

    def parse(self):
        self._permission = ResourcePermission()
        self._permission.datasource_id = self._datasource_id
        self._permission.resource_id = self._resource_id
        user_info = self._user_info_map[self._shared_id] if self._shared_id in self._user_info_map else None
        self._permission.email = user_info.email if user_info else self._shared_id
        self._permission.permission_id = self._shared_id
        self._permission.permission_type = constants.Role.WRITER.value if self._is_editable else constants.Role.READER.value
        user_member_type = user_info.member_type if user_info else None
        exposure_type = utils.get_highest_exposure_type(self._permission_exposure_type, user_member_type)
        self._permission.exposure_type = exposure_type
        self.set_permission_exposure_is_external(exposure_type)

    def set_permission_exposure_is_external(self, exposure_type):
        is_external = False
        if not is_external and exposure_type == constants.EntityExposureType.EXTERNAL.value:
            self._external_perms_exposure = True

        else:
            self._external_perms_exposure = False

    def get_permission_exposure_is_external(self):
        return self._external_perms_exposure

    def get_model(self):
        return self._permission


class SlackChannel:
    def __init__(self, datasource_id, payload):
        self._datasource_id = datasource_id
        self._payload = payload
        self._channel = None
        self._directory_members = []
        self.parse()

    def parse(self):
        self._channel = DomainUser()
        self._channel.datasource_id = self._datasource_id
        self._channel.email = self._payload['name']
        self._channel.full_name = self._payload['name']
        self._channel.user_id = self._payload['id']
        self._channel.config = json.dumps({'channel_type': self._payload['channel_type']})
        self._channel.type = constants.DirectoryEntityType.CHANNEL.value

        # construct user_info map for checking for removed users from channels
        db_session = db_connection().get_session()
        existing_users = db_session.query(DomainUser).filter(DomainUser.datasource_id == self._datasource_id).all()
        user_info_map = {}
        for user in existing_users:
            user_info_map[user.user_id] = user

        creator = self._payload["creator"]
        group_members = self._payload["members"] if 'members' in self._payload else []

        directory_member_list = []
        is_external_user_in_channel = False
        for member in group_members:
            if member in user_info_map:
                user_info = user_info_map[member]
                directory_member_obj = SlackDirectoryMember(db_session, self._datasource_id, user_info, member, creator,
                                                            self._payload)
                self._directory_members.append(directory_member_obj.get_model())
                is_external_user_in_channel = directory_member_obj.get_is_external_user()

        self._channel.member_type = constants.EntityExposureType.EXTERNAL.value if is_external_user_in_channel else \
            constants.EntityExposureType.INTERNAL.value

    def get_model(self):
        return self._channel

    def get_directory_members(self):
        return self._directory_members


class SlackDirectoryMember:
    def __init__(self, db_session, datasource_id, user_info, member_id, channel_creator, payload):
        self.db_session = db_session
        self._datasource_id = datasource_id
        self._payload = payload
        self._user_info = user_info
        self.is_external_user = False
        self._member_id = member_id
        self._channel_creator = channel_creator
        self._member = None
        self.parse()

    def parse(self):
        self._member = DirectoryStructure()
        self._member.datasource_id = self._datasource_id
        self._member.parent_email = self._payload['name']
        self._member.member_email = self._user_info.email
        self._member.member_id = self._member_id
        self._member.member_type = "USER"
        self._member.member_role = "ADMIN" if self._channel_creator == self._member_id else "MEMBER"

        if self._user_info.member_type == constants.EntityExposureType.EXTERNAL.value:
            self.is_external_user = True

    def get_is_external_user(self):
        return self.is_external_user

    def get_model(self):
        return self._member


class SlackApplication:
    def __init__(self, db_session, domain_id, datasource_id, payload):
        self.datasource_id = datasource_id
        self._payload = payload
        self._application = None
        self._domain_id = domain_id
        self._db_session = db_session
        self.parse()

    def parse(self):
        self._application = Application()
        self._application.domain_id = self._domain_id
        self._application.timestamp = datetime.datetime.fromtimestamp(int( self._payload["date"]))
        self._application.purchased_date = datetime.datetime.fromtimestamp(int( self._payload["date"]))
        self._application.unit_num = 0

        app_name = self._payload["app_type"] if "app_type" in self._payload else self._payload["service_type"]
        scopes = None
        max_score = 0
        trusted_domain_apps = (get_trusted_entity_for_domain(self._db_session, self._domain_id))["trusted_apps"]

        if 'scope' in self._payload:
            scopes = self._payload["scope"]
            if not app_name in trusted_domain_apps:
                max_score = slack_utils.get_app_score(scopes)

        self._application.display_text = app_name
        self._application.scopes = scopes
        self._application.score = max_score

        inventory_app = self._db_session.query(AppInventory).filter(AppInventory.name == app_name).first()
        inventory_app_id = inventory_app.id if inventory_app else None
        if inventory_app_id:
            self._application.inventory_app_id = inventory_app_id



    def get_model(self):
        return self._application


class SlackUserAppAssociation:
    def __init__(self, datasource_id, payload):
        self._user_app_association = None
        self._datasource_id = datasource_id
        self._payload = payload
        self.parse()

    def parse(self):
        self._user_app_association = ApplicationUserAssociation()
        self._user_app_association.client_id = self._payload['app_id']
        self._user_app_association.datasource_id = self._datasource_id
        self._user_app_association.user_email = self._payload['user_id']
        self._user_app_association.application_id = self._payload['application_id']

    def get_model(self):
        return self._user_app_association
