import os
from enum import Enum

class ScannerTypes(Enum):
    REPOSITORIES = "REPOSITORIES"
    ORGANISATIONS = "ORGANISATIONS"
    ORG_MEMBERS = "ORG_MEMBERS"
    REP_COLLABORATORS = "REP_COLLABORATORS"

class AppChangedTypes(Enum):
    ADDED = "added"
    REMOVED = "removed"

class GithubNativeEventTypes(Enum):
    REPOSITORY = "repository"
    ORGANIZATION = "organization"
    TEAM = "team"
    REPOSITORY_VULNERABILITY_ALERT = "repository_vulnerability_alert"
    FORK = "fork"
