from adya.common.constants import constants
from adya.common.db.connection import db_connection
from adya.gsuite import gutils
from adya.common.db.models import Resource, ResourcePermission, DomainUser, DataSource


class GsuiteResource:
    def __init__(self, datasource_id, payload):
        self._datasource_id = datasource_id
        self._payload = payload
        self._external_users = []
        self._resource = None
        self.parse()

    def parse(self):
        self._resource = Resource()
        self._resource.datasource_id = self._datasource_id
        resource_id = self._payload['id']
        self._resource.resource_id = resource_id
        self._resource.resource_name = self._payload['name']
        self._resource.resource_type = gutils.get_file_type_from_mimetype(self._payload['mimeType'])
        self._resource.resource_owner_id = self._payload['owners'][0].get('emailAddress')
        self._resource.resource_size = self._payload.get('size')
        self._resource.creation_time = self._payload['createdTime'][:-1]
        self._resource.last_modified_time = self._payload['modifiedTime'][:-1]
        self._resource.web_content_link = self._payload.get("webContentLink")
        self._resource.web_view_link = self._payload.get("webViewLink")
        self._resource.icon_link = self._payload.get("iconLink")
        self._resource.thumthumbnail_link = self._payload.get("thumbnailLink")
        self._resource.description = self._payload.get("description")
        self._resource.parent_id = self._payload.get('parents')[0] if self._payload.get('parents') else None
        self._resource.last_modifying_user_email = ""
        if self._payload.get("lastModifyingUser"):
            self._resource.last_modifying_user_email = self._payload["lastModifyingUser"].get("emailAddress")

        #1. Set resource exposure type based on highest exposure from all permissions
        #2. Collect all external users
        resource_exposure_type = constants.ResourceExposureType.PRIVATE
        external_user_map = {}
        permissions_payload = self._payload.get('permissions')
        self._resource.permissions = []
        if permissions_payload:
            for payload in permissions_payload:
                permission = GsuitePermission(self._datasource_id, self._resource.resource_id, self._resource.resource_owner_id, payload)
                permission_model = permission.get_model()
                if not permission_model:
                    continue
                self._resource.permissions.append(permission_model)
                resource_exposure_type = gutils.get_resource_exposure_type(permission_model.exposure_type, resource_exposure_type)
                if (not permission_model.email in external_user_map) and permission.get_external_user():
                    external_user_map[permission_model.email]= permission.get_external_user()

        self._resource.exposure_type = resource_exposure_type
        self._external_users = external_user_map.values()

    def get_model(self):
        return self._resource

    def get_external_users(self):
        return self._external_users


class GsuitePermission:
    def __init__(self, datasource_id, resource_id, resource_owner, payload):
        self._datasource_id = datasource_id
        self._resource_id = resource_id
        self._resource_owner = resource_owner
        self._payload = payload
        self._external_user = None
        self._permission = None
        self.parse()

    def parse(self):
        self._permission = ResourcePermission()
        permission_id = self._payload.get('id')
        email_address = self._payload.get('emailAddress')
        display_name = self._payload.get('displayName')

        self._permission.datasource_id = self._datasource_id
        self._permission.resource_id = self._resource_id
        self._permission.permission_id = permission_id
        self._permission.permission_type = self._payload.get('role')
        expiration_time = self._payload.get('expirationTime')
        if expiration_time:
            self._permission.expiration_time = expiration_time[:-1]
        is_deleted = self._payload.get('deleted')
        if is_deleted:
            self._permission = None
            return
        self._permission.is_deleted = is_deleted

        permission_exposure = constants.ResourceExposureType.PRIVATE
        if email_address:
            db_session = db_connection().get_session()
            domain_id = db_session.query(DataSource.domain_id).filter(DataSource.datasource_id == self._datasource_id).first()
            if gutils.check_if_external_user(db_session, domain_id,email_address):
                permission_exposure = constants.ResourceExposureType.EXTERNAL
                self.set_external_user(email_address, display_name)
            elif not email_address == self._resource_owner:
                permission_exposure = constants.ResourceExposureType.INTERNAL
        #Shared with everyone in domain
        elif display_name:
            email_address = "__ANYONE__@"+ display_name
            permission_exposure = constants.ResourceExposureType.DOMAIN

        #  Shared with anyone with link
        elif permission_id == 'anyoneWithLink':
            email_address = constants.ResourceExposureType.ANYONEWITHLINK
            permission_exposure = constants.ResourceExposureType.ANYONEWITHLINK

        #Shared with everyone in public
        else:
            email_address = constants.ResourceExposureType.PUBLIC
            permission_exposure = constants.ResourceExposureType.PUBLIC
        
        self._permission.email = email_address
        self._permission.exposure_type = permission_exposure

    def get_model(self):
        return self._permission

    def set_external_user(self, email, display_name):
        self._external_user = DomainUser()
        self._external_user.datasource_id = self._datasource_id
        self._external_user.email = email
        self._external_user.first_name = ""
        self._external_user.last_name = ""
        if display_name and display_name != "":
            name_list = display_name.split(' ')
            self._external_user.first_name = name_list[0]
            if len(name_list) > 1:
                self._external_user.last_name = name_list[1]
        self._external_user.member_type = constants.UserMemberType.EXTERNAL

    def get_external_user(self):
        return self._external_user
        

    
            
