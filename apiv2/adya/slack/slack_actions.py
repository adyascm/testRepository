import json

from adya.common.db.action_utils import delete_resource_permission
from adya.common.utils.response_messages import Logger
from adya.slack import slack_utils


class Actions:
    def __init__(self, datasource_id, permissions, initiated_by_email):
        self.datasource_id = datasource_id
        self.permissions = permissions
        self.exception_messages = []
        self.updated_permissions = {}
        self.initiated_by_email = initiated_by_email
        self.slack_client = slack_utils.get_slack_client(self.datasource_id)

    def get_exception_messages(self):
        return self.exception_messages

    def delete_public_and_external_sharing_for_file(self):
        for permission in self.permissions:
            file_id = permission['resource_id']
            try:
                removed_file = self.slack_client.api_call(
                    "files.revokePublicURL",
                    file=file_id
                )
            except Exception as ex:
                Logger().exception("Exception ocuured while removing the permission - {}".format(ex))
                content = json.loads(ex.content)
                self.exception_messages.append(content['error']['message'])

            self.updated_permissions[file_id] = permission
        try:
            delete_resource_permission(self.initiated_by_email, self.datasource_id, self.updated_permissions)
        except Exception as ex:
            Logger().exception("Exception occurred while removing permission from db")
            self.exception_messages.append("Exception occurred while removing permission from db")

        return self.updated_permissions

