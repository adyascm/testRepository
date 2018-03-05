import json
from sqlalchemy import Column, Sequence, Integer, String, DateTime, BigInteger, ForeignKey, Boolean, Text
from sqlalchemy.ext.declarative import declarative_base, DeclarativeMeta
from sqlalchemy.orm import relationship
from datetime import date, datetime

Base = declarative_base()


class AlchemyEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj.__class__, DeclarativeMeta):
            # an SQLAlchemy class
            fields = {}
            for field in [x for x in dir(obj) if not x.startswith('_') and x != 'metadata']:
                data = obj.__getattribute__(field)
                if isinstance(data, (datetime)):
                    fields[field] = data.strftime("%Y-%m-%dT%H:%M:%SZ")
                elif isinstance(data, list):
                    try:
                        json.dumps(data, cls=AlchemyEncoder)  # this will fail on non-encodable values, like other classes
                        fields[field] = data
                    except TypeError as ex:
                        fields[field] = None
                elif isinstance(data.__class__, DeclarativeMeta):
                    fields[field] = None
                else:
                    try:
                        json.dumps(data)  # this will fail on non-encodable values, like other classes
                        fields[field] = data
                    except TypeError as ex:
                        fields[field] = None
                    except Exception as ex:
                        fields[field] = None
            # a json-encodable dict
            return fields
        return json.JSONEncoder.default(self, obj)



class Domain(Base):
    __tablename__ = 'domain'
    domain_id = Column(String(255), primary_key=True, index=True)
    domain_name = Column(String(255))
    creation_time = Column(DateTime)
    login_users = relationship("LoginUser", backref="domain")

    def __repr__(self):
        return "<Domain('%s', '%s')>" % (self.domain_id, self.domain_name)


class LoginUser(Base):
    __tablename__ = 'login_user'
    domain_id = Column(String(255), ForeignKey('domain.domain_id'))
    email = Column(String(320), primary_key=True)
    first_name = Column(String(255))
    last_name = Column(String(255))
    auth_token = Column(String(36))
    refresh_token = Column(String(255))
    is_admin_user = Column(Boolean, default=True)
    creation_time = Column(DateTime)
    last_login_time = Column(DateTime)
    authorize_scope_name = Column(String(50))

class DataSource(Base):
    __tablename__ = 'datasource'
    domain_id = Column(String(255), ForeignKey('domain.domain_id'))
    datasource_id = Column(String(36), primary_key=True,index=True)
    display_name = Column(String(255))
    datasource_type = Column(String(50))
    creation_time = Column(DateTime)
    total_file_count = Column(BigInteger, default=0)
    processed_file_count = Column(BigInteger, default=0)
    file_scan_status = Column(Integer, default=0)
    processed_parent_permission_count = Column(BigInteger, default=0)
    total_group_count = Column(Integer, default=0)
    processed_group_count = Column(Integer, default=0)
    group_scan_status = Column(Integer, default=0)
    total_user_count = Column(Integer, default=0)
    processed_user_count = Column(BigInteger, default=0)
    user_scan_status = Column(Integer, default=0)
    is_serviceaccount_enabled = Column(Boolean)
    is_push_notifications_enabled = Column(Boolean)
    is_dummy_datasource = Column(Boolean,default=False)


class DomainUser(Base):
    __tablename__ = 'domain_user'
    domain_id = Column(String(255), ForeignKey('domain.domain_id'))
    datasource_id = Column(String(36), primary_key=True)
    email = Column(String(320), primary_key=True, index=True)
    # we can't put constraint for firstname and lastname null
    # because if we get External user from other domain provider that might not have Names
    first_name = Column(String(255))
    last_name = Column(String(255))
    full_name = Column(String(255))
    is_admin = Column(Boolean, default=False)
    creation_time = Column(DateTime)
    is_suspended = Column(Boolean,default=False)
    primary_email = Column(String(320))
    user_id = Column(String(260))
    photo_url = Column(Text)
    aliases = Column(Text)
    member_type = Column(String(6))
    applications = relationship("Application", backref="domain_user")


class Resource(Base):
    __tablename__ = 'resource'
    domain_id = Column(String(255))
    datasource_id = Column(String(36), ForeignKey('datasource.datasource_id'),primary_key=True,index=True)
    resource_id = Column(String(100), primary_key=True, index=True)
    resource_name = Column(String(260), nullable=False)
    resource_type = Column(String(50))
    resource_size = Column(BigInteger)
    resource_owner_id = Column(String(320))
    last_modified_time = Column(DateTime)
    creation_time = Column(DateTime)
    exposure_type = Column(String(10))
    web_content_link = Column(Text)
    web_view_link = Column(Text)
    icon_link = Column(Text)
    thumthumbnail_link = Column(Text)
    description = Column(Text)
    last_modifying_user_email = Column(String(255))
    parent_id = Column(String(100), nullable=True)
    permissions = relationship("ResourcePermission",primaryjoin="and_(Resource.datasource_id==ResourcePermission.datasource_id,Resource.resource_id==ResourcePermission.resource_id)", backref="resource")
    def __repr__(self):
        return "Resource('%s','%s', '%s', '%s')" % (
            self.domain_id, self.datasource_id, self.resource_id, self.resource_name)

class ResourceParent(Base):
    __tablename__ = 'resource_parent_table'
    domain_id = Column(String(255))
    datasource_id = Column(String(36))
    resource_id = Column(String(100),ForeignKey('resource.resource_id'), primary_key=True)
    email = Column(String(320), primary_key=True)
    parent_id = Column(String(260))

    def __repr__(self):
        return "ResourceParent('%s','%s', '%s')" % (self.domain_id, self.resource_id, self.email)

class ResourcePermission(Base):
    __tablename__ = 'resource_permission_table'
    domain_id = Column(String(255))
    datasource_id = Column(String(36),ForeignKey('resource.datasource_id'),primary_key=True)
    resource_id = Column(String(100), ForeignKey('resource.resource_id'), primary_key=True)
    email = Column(String(320), primary_key=True)
    permission_id = Column(String(260), nullable=False)
    permission_type = Column(String(10))
    name = Column(Text)
    expiration_time = Column(DateTime)
    is_deleted = Column(Boolean, default=False)
    def __repr__(self):
        return "ResourcePermission('%s','%s', '%s')" % (self.domain_id, self.resource_id, self.email)
        

class DomainGroup(Base):
    __tablename__ = 'domain_group'
    domain_id = Column(String(255), ForeignKey('domain.domain_id'))
    datasource_id = Column(String(36) , primary_key=True)
    group_id = Column(String(260), nullable=False)
    email = Column(String(320), primary_key=True)
    name = Column(String(255))
    direct_members_count = Column(Integer,default=0)
    description = Column(Text)
    include_all_user = Column(Boolean, default=False)
    aliases = Column(Text)
    is_external = Column(Boolean,default=False)


class DirectoryStructure(Base):
    __tablename__ = 'domain_directory_structure'
    domain_id = Column(String(255), ForeignKey('domain.domain_id'))
    datasource_id = Column(String(36),primary_key=True)
    member_email = Column(String(320), primary_key=True)
    member_id = Column(String(260), nullable=False)
    member_role =  Column(String(10), nullable=False)
    member_type =  Column(String(10), nullable=False)
    parent_email = Column(String(320), primary_key=True)


class Report(Base):
    __tablename__ = 'report'
    domain_id = Column(String(255), ForeignKey('domain.domain_id'))
    report_id = Column(String(36), primary_key=True)
    name = Column(String(255))
    description = Column(String(320))
    config = Column(Text)
    frequency = Column(String(320))
    receivers = Column(String(320))
    creation_time = Column(DateTime)
    last_trigger_time = Column(DateTime)
    is_active = Column(Boolean, default=False)


class PushNotificationsSubscription(Base):
    __tablename__ = 'push_notifications_subscription'
    domain_id = Column(String(255), ForeignKey('domain.domain_id'))
    datasource_id = Column(String(36), primary_key=True)
    channel_id = Column(String(100), primary_key=True)
    drive_root_id = Column(String(255))
    user_email = Column(String(255))
    page_token = Column(Integer)
    in_progress = Column(Boolean)
    stale = Column(Boolean)
    last_accessed = Column(DateTime)
    expire_at = Column(DateTime)
  

class Action(Base):
    __tablename__ = 'action'
    datasource_type = Column(String(255), primary_key=True)
    key = Column(String(200), primary_key=True)
    name = Column(String(200))
    description = Column(String(1000))
    parameters = Column(Text)
    is_admin_only = Column(Boolean)


class AuditLog(Base):
    __tablename__ = 'audit_log'
    log_id = Column(Integer, autoincrement=True, primary_key=True)
    domain_id = Column(String(255))
    datasource_id = Column(String(36),primary_key=True)
    initiated_by = Column(String(100))
    action_name = Column(String(200))
    parameters = Column(String(1000))
    affected_entity = Column(String(255))
    affected_entity_type = Column(String(100))
    timestamp = Column(DateTime)

class Application(Base):
    __tablename__ = 'application'
    domain_id = Column(String(255))
    datasource_id = Column(String(36),primary_key =True)
    client_id = Column(String(255),primary_key=True)
    user_email = Column(String(320), ForeignKey('domain_user.email'), primary_key= True)
    user_key =Column(String(50))
    display_text = Column(String(255))
    anonymous = Column(Boolean, default= True)
    scopes = Column(Text)
    is_readonly_scope = Column(Boolean)

def get_table(tablename):
    if tablename == 'resource':
        return Resource
    elif tablename == 'user':
        return DomainUser
    elif tablename == 'group':
        return DomainGroup
    elif tablename == 'directory_structure':
        return DirectoryStructure
    elif tablename == 'resource_permission':
        return ResourcePermission
