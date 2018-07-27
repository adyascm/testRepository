from adya.common.constants import constants
from adya.common.db.connection import db_connection
from adya.common.utils import utils
from adya.gsuite import gutils
from adya.common.db.models import Resource, ResourcePermission, DomainUser, DataSource


class GsuiteResource:
    def __init__(self, domain_id, datasource_id, payload, external_user_map, trusted_domains):
        self._domain_id = domain_id
        self._datasource_id = datasource_id
        self._payload = payload
        self._external_user_map = external_user_map
        self._trusted_domains = trusted_domains
        self._resource = {}
        self._permissions = []
        self.parse()

    def parse(self):
        self._resource["datasource_id"] = self._datasource_id
        resource_id = self._payload['id']
        self._resource["resource_id"] = resource_id
        self._resource["resource_name"] = self._payload['name']
        self._resource["resource_type"] = gutils.get_file_type_from_mimetype(self._payload['mimeType'])
        self._resource["resource_owner_id"] = self._payload['owners'][0].get('emailAddress')
        self._resource["resource_size"] = self._payload.get('size')
        self._resource["creation_time"] = self._payload['createdTime'][:-1]
        self._resource["last_modified_time"] = self._payload['modifiedTime'][:-1]
        self._resource["web_content_link"] = self._payload.get("webContentLink")
        self._resource["web_view_link"] = self._payload.get("webViewLink")
        self._resource["icon_link"] = self._payload.get("iconLink")
        self._resource["thumthumbnail_link"] = self._payload.get("thumbnailLink")
        self._resource["description"] = self._payload.get("description")
        self._resource["parent_id"] = self._payload.get('parents')[0] if self._payload.get('parents') else None
        self._resource["last_modifying_user_email"] = ""
        if self._payload.get("lastModifyingUser"):
            self._resource["last_modifying_user_email"] = self._payload["lastModifyingUser"].get("emailAddress")

        #1. Set resource exposure type based on highest exposure from all permissions
        #2. Collect all external users
        resource_exposure_type = constants.EntityExposureType.PRIVATE.value
        permissions_payload = self._payload.get('permissions')
        if permissions_payload:
            for permission_payload in permissions_payload:
                permission = GsuitePermission(self._domain_id, self._datasource_id, resource_id, self._resource["resource_owner_id"], permission_payload, self._external_user_map, self._trusted_domains).parse()
                if not permission:
                    continue
                self._permissions.append(permission)
                resource_exposure_type = utils.get_highest_exposure_type(permission["exposure_type"], resource_exposure_type)

        self._resource["exposure_type"] = resource_exposure_type
        return self._resource

    def get_permissions(self):
        return self._permissions


class GsuitePermission:
    def __init__(self, domain_id, datasource_id, resource_id, resource_owner, payload, external_user_map, trusted_domains):
        self._domain_id = domain_id
        self._datasource_id = datasource_id
        self._resource_id = resource_id
        self._resource_owner = resource_owner
        self._payload = payload
        self._external_user_map = external_user_map
        self._trusted_domains = trusted_domains
        self._permission = {}
        self.parse()

    def parse(self):
        permission_id = self._payload.get('id')
        email_address = self._payload.get('emailAddress')
        display_name = self._payload.get('displayName')

        self._permission["datasource_id"] = self._datasource_id
        self._permission["resource_id"] = self._resource_id
        self._permission["permission_id"] = permission_id
        self._permission["permission_type"] = self._payload.get('role')
        expiration_time = self._payload.get('expirationTime')
        if expiration_time:
            self._permission["expiration_time"] = expiration_time[:-1]
        is_deleted = self._payload.get('deleted')
        if is_deleted:
            self._permission = None
            return

        if email_address:
            if email_address == self._resource_owner:
                permission_exposure = constants.EntityExposureType.PRIVATE.value
            elif email_address in self._external_user_map:
                permission_exposure = self._external_user_map[email_address]["member_type"]
            else:
                permission_exposure = utils.check_if_external_user(None, self._domain_id, email_address, self._trusted_domains)
            if permission_exposure == constants.EntityExposureType.EXTERNAL.value or permission_exposure == constants.EntityExposureType.TRUSTED.value:
                self.set_external_user(email_address, display_name, permission_exposure)

        #Shared with everyone in domain
        elif display_name:
            email_address = "__ANYONE__@"+ display_name
            permission_exposure = constants.EntityExposureType.DOMAIN.value

        #  Shared with anyone with link
        elif permission_id == 'anyoneWithLink':
            email_address = constants.EntityExposureType.ANYONEWITHLINK.value
            permission_exposure = constants.EntityExposureType.ANYONEWITHLINK.value

        #Shared with everyone in public
        else:
            email_address = constants.EntityExposureType.PUBLIC.value
            permission_exposure = constants.EntityExposureType.PUBLIC.value
        
        self._permission["email"] = email_address
        self._permission["exposure_type"] = permission_exposure
        return self._permission

    def set_external_user(self, email, display_name, permission_exposure):
        external_user = {}
        external_user["datasource_id"] = self._datasource_id
        external_user["email"] = email
        external_user["first_name"] = ""
        external_user["last_name"] = ""
        if display_name and display_name != "":
            name_list = display_name.split(' ')
            external_user["first_name"] = name_list[0]
            if len(name_list) > 1:
                external_user["last_name"] = name_list[1]
        external_user["member_type"] = permission_exposure
        self._external_user_map[email] = external_user

        

    
            
