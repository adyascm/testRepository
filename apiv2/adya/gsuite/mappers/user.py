from adya.common.constants import constants
from adya.common.db.connection import db_connection
from adya.common.db.models import DomainUser


class GsuiteUser:
    def __init__(self, datasource_id, payload):
        self._datasource_id = datasource_id
        self._payload = payload
        self._user = None
        self.parse()

    def parse(self):
        self._user = DomainUser()
        self._user.datasource_id = self._datasource_id
        self._user.email = self._payload.get("primaryEmail")
        names = self._payload.get("name")
        self._user.first_name = names.get("givenName")
        self._user.last_name =names.get("familyName")
        self._user.full_name = names.get("fullName")
        self._user.user_id = self._payload['id']
        self._user.is_admin = self._payload.get('isAdmin')
        self._user.is_suspended = self._payload.get('suspended')
        self._user.creation_time = self._payload.get('creationTime')[:1]
        self._user.photo_url = self._payload.get("thumbnailPhotoUrl")
        self._user.type = constants.DirectoryEntityType.USER.value
        self._user.member_type = constants.EntityExposureType.INTERNAL.value
        aliases = self._payload.get("aliases")
        if aliases:
            self._user.aliases = ",".join(aliases)

    def get_model(self):
        return self._user
