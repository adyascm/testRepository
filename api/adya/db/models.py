from sqlalchemy import Column, Sequence, Integer, String, DateTime,BigInteger,ForeignKey,Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship

Base = declarative_base()


class Domain(Base):
    __tablename__ = 'domain'
    domain_id = Column(String(255), primary_key=True)
    domain_name = Column(String(255))
    creation_time = Column(DateTime)
    login_users = relationship("LoginUser", backref="domain")

    def __repr__(self):
        return "<Domain('%s', '%s')>" % (self.domain_id, self.domain_name)

class Resource(Base):
    __tablename__ = 'resource'
    domain_id = Column(String(255))
    datasource_id = Column(String(36),nullable=False)
    resource_id = Column(String(100), primary_key=True)
    resource_name = Column(String(260),nullable=False)
    resource_type = Column(String(50))
    resource_size = Column(BigInteger)
    resource_owner_id = Column(String(320))
    last_modified_time = Column(DateTime)
    creation_time = Column(DateTime)
    exposure_type = Column(String(10))

    def __repr__(self):
        return "Resource('%s','%s', '%s', '%s')" % (self.domain_id,self.datasource_id,self.resource_id,self.resource_name)

class ResourcePermission(Base):
    __tablename__ = 'resource_permission_table'
    domain_id = Column(String(255))
    resource_id = Column(String(100), primary_key=True)
    email = Column(String(320), primary_key=True)
    permission_id = Column(String(260), nullable=False)
    permission_type = Column(String(10))

    def __repr__(self):
        return "ResourcePermission('%s','%s', '%s')" % (self.domain_id,self.resource_id,self.email)

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
    datasource_id = Column(String(255), primary_key=True)
    display_name = Column(String(255))
    datasource_type = Column(String(50))
    creation_time = Column(DateTime)


