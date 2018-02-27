from enum import Enum
import json

class ActionNames(Enum):
    TRANSFER_OWNERSHIP = "transfer_ownership"
    CHANGE_OWNER_OF_FILE = "change_owner"
    REMOVE_EXTERNAL_ACCESS = "remove_external_access"
    REMOVE_EXTERNAL_ACCESS_TO_RESOURCE = "remove_external_access_to_resource"
    MAKE_ALL_FILES_PRIVATE = "make_all_files_private"
    MAKE_RESOURCE_PRIVATE = "make_resource_private"
    DELETE_PERMISSION_FOR_USER = "delete_permission_for_user"
    UPDATE_PERMISSION_FOR_USER = "update_permission_for_user"


class TransferOwnershipAction():
    DatasourceType = "GSUITE"
    Name = ActionNames.TRANSFER_OWNERSHIP
    Description = "Transfers all files owned by one user to some other specified user"
    Parameters = { "old_owner_email": "", "new_owner_email": "" }

    def toJSON(self):
        return json.dumps(self, default=lambda o: o.__dict__,
                          sort_keys=True, indent=4)

class ChangeOwnerOfFileAction():
    DatasourceType = "GSUITE"
    Name = ActionNames.CHANGE_OWNER_OF_FILE
    Description = "Transfers single file owned by one user to some other specified user"
    Parameters = { "resource_id": "", "old_owner_email": "", "new_owner_email": "" }

    def toJSON(self):
        return json.dumps(self, default=lambda o: o.__dict__,
                          sort_keys=True, indent=4)

class RemoveExternalAccessAction():
    DatasourceType = "GSUITE"
    Name = ActionNames.REMOVE_EXTERNAL_ACCESS
    Description = "Remove external access for all files owned by user"
    Parameters = { "user_email": "" }

    def toJSON(self):
        return json.dumps(self, default=lambda o: o.__dict__,
                          sort_keys=True, indent=4)

class RemoveExternalAccessToResourceAction():
    DatasourceType = "GSUITE"
    Name = ActionNames.REMOVE_EXTERNAL_ACCESS_TO_RESOURCE
    Description = "Remove all external access for the given resource"
    Parameters = { "resource_id": "" }

    def toJSON(self):
        return json.dumps(self, default=lambda o: o.__dict__,
                          sort_keys=True, indent=4)

class MakeAllFilesPrivateAction():
    DatasourceType = "GSUITE"
    Name = ActionNames.MAKE_ALL_FILES_PRIVATE
    Description = "Make all files owned by user to private"
    Parameters = { "user_email": "" }

    def toJSON(self):
        return json.dumps(self, default=lambda o: o.__dict__,
                          sort_keys=True, indent=4)

class MakeResourcePrivateAction():
    DatasourceType = "GSUITE"
    Name = ActionNames.MAKE_RESOURCE_PRIVATE
    Description = "Remove all sharing on a given resource"
    Parameters = { "resource_id": "" }

    def toJSON(self):
        return json.dumps(self, default=lambda o: o.__dict__,
                          sort_keys=True, indent=4)

class DeletePermissionForUserAction():
    DatasourceType = "GSUITE"
    Name = ActionNames.DELETE_PERMISSION_FOR_USER
    Description = "Remove access granted to a user for a resource"
    Parameters = { "user_email": "", "resource_owner_id": "", "resource_id": "" }

    def toJSON(self):
        return json.dumps(self, default=lambda o: o.__dict__,
                          sort_keys=True, indent=4)

class UpdatePermissionForUserAction():
    DatasourceType = "GSUITE"
    Name = ActionNames.UPDATE_PERMISSION_FOR_USER
    Description = "Update the permission granted to a user for a resource"
    Parameters = {"user_email": "", "resource_owner_id": "", "resource_id": "", "new_permission_role": ""}

    def toJSON(self):
        return json.dumps(self, default=lambda o: o.__dict__,
                          sort_keys=True, indent=4)





