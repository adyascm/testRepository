import os
from enum import Enum

class ScannerTypes(Enum):
    USERS = "USERS"
    REPOSITORIES = "REPOSITORIES"
    ORGANISATIONS = "ORGANISATIONS"
    ACCOUNT = "ACCOUNT"

class AppChangedTypes(Enum):
    ADDED = "added"
    REMOVED = "removed"

class NotificationEvents(Enum):
    REPOSITORY = "repository"
    ORGANIZATION = "organization"
    TEAM = "team"
