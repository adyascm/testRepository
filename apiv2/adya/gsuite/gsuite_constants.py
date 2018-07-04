import os
from enum import Enum

class ScannerTypes(Enum):
    USERS = "USERS"
    APPS = "APPS"
    GROUPS = "GROUPS"
    MEMBERS = "MEMBERS"
    FILES = "FILES"
