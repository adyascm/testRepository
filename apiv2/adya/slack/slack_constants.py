import os
from enum import Enum

class ScannerTypes(Enum):
    USERS = "USERS"
    APPS = "APPS"
    CHANNELS = "CHANNELS"
    FILES = "FILES"

class AppChangedTypes(Enum):
    ADDED = "added"
    REMOVED = "removed"

class ChannelTypes(Enum):
    PRIVATE = "private"
    PUBLIC = "public"
    
class NotificationEvents(Enum):
    FILE_CHANGED = 'file_change'
    FILE_SHARED = 'file_shared'
    USER_CHANGED = 'user_change'
    CHANNEL_CREATED = 'channel_created'
    CHANNEL_ARCHIVE = 'channel_archive'
    CHANNEL_UNARCHIVE = 'channel_unarchive'
    CHANNEL_HISTORY_CHANGED = 'channel_history_changed'
    CHANNEL_RENAME = 'channel_rename'
    GROUP_ARCHIVE = 'group_archive'
    GROUP_UNARCHIVE = 'group_unarchive'
    GROUP_RENAME = 'group_rename'
    MEMBER_JOINED_CHANNEL = 'member_joined_channel'
    MEMBER_LEFT_CHANNEL = 'member_left_channel'
    SUBTEAM_MEMBERS_CHANGED = 'subteam_members_changed'
    SUBTEAM_UPDATED = 'subteam_updated'
    SUBTEAM_CREATED = 'subteam_created'
    TEAM_JOIN = 'team_join'
