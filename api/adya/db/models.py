import json
from sqlalchemy import Column, Sequence, Integer, String, DateTime,BigInteger,ForeignKey,Boolean
from sqlalchemy.ext.declarative import declarative_base,DeclarativeMeta
from sqlalchemy.orm import relationship


Base = declarative_base()

class AlchemyEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj.__class__, DeclarativeMeta):
            # an SQLAlchemy class
            fields = {}
            for field in [x for x in dir(obj) if not x.startswith('_') and x != 'metadata']:
                data = obj.__getattribute__(field)
                try:
                    json.dumps(data) # this will fail on non-encodable values, like other classes
                    fields[field] = data
                except TypeError:
                    fields[field] = None
            # a json-encodable dict
            return fields
        return json.JSONEncoder.default(self, obj)


class Domain(Base):
    __tablename__ = 'domain'
    domain_id = Column(String(255), primary_key=True)
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
    is_enterprise_user = Column(Boolean, default=True)
    creation_time = Column(DateTime)
    last_login_time = Column(DateTime)


class DataSource(Base):
    __tablename__ = 'data_source'
    domain_id = Column(String(255), ForeignKey('domain.domain_id'))
    datasource_id = Column(String(36), primary_key=True)
    display_name = Column(String(255))
    datasource_type = Column(String(50))
    creation_time = Column(DateTime)


class DomainUser(Base):
    __tablename__ ='domain_user'
    domain_id = Column(String(255), ForeignKey('domain.domain_id'))
    datasource_id = Column(String(36), primary_key=True)
    email = Column(String(320), primary_key=True)
    # we can't put constraint for firstname and lastname null
    # because if we get External user from other domain provider that might not have Names
    first_name = Column(String(255))
    last_name = Column(String(255))
    member_type = Column(String(6))


class Resource(Base):
    __tablename__ = 'resource'
    domain_id = Column(String(255), ForeignKey('domain.domain_id'))
    datasource_id = Column(String(36),nullable=False)
    resource_id = Column(String(100), primary_key=True)
    resource_name = Column(String(260), nullable=False)
    resource_type = Column(String(50))
    resource_size = Column(BigInteger)
    resource_owner_id = Column(String(320))
    last_modified_time = Column(DateTime)
    creation_time = Column(DateTime)
    exposure_type = Column(String(10))
    resource_parent_id = Column(String(100))
    def __repr__(self):
        return "Resource('%s','%s', '%s', '%s')" % (
        self.domain_id, self.datasource_id, self.resource_id, self.resource_name)


class DomainGroup(Base):
    __tablename__ ='domain_group'
    domain_id = Column(String(255), ForeignKey('domain.domain_id'))
    datasource_id = Column(String(36))
    email = Column(String(320), primary_key=True)
    name = Column(String(255))
    include_all_user = Column(Boolean,default=False)


class DirectoryStructure(Base):
    __tablename__ = 'domain_directory_structure'
    domain_id = Column(String(255), ForeignKey('domain.domain_id'))
    datasource_id = Column(String(36))
    member_email = Column(String(320), primary_key=True)
    parent_email = Column(String(320))


class ResourcePermission(Base):
    __tablename__ = 'resource_permission_table'
    domain_id = Column(String(255), ForeignKey('domain.domain_id'))
    resource_id = Column(String(100), primary_key=True)
    email = Column(String(320), primary_key=True)
    permission_id = Column(String(260), nullable=False)
    permission_type = Column(String(10))

    def __repr__(self):
        return "ResourcePermission('%s','%s', '%s')" % (self.domain_id, self.resource_id, self.email)

