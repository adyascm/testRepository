from sqlalchemy import Column, Sequence, Integer, String, DateTime,BigInteger
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()


class Account(Base):
    __tablename__ = 'account'
    domain_id = Column(String(255), primary_key=True)
    domain_name = Column(String(255))
    create_time = Column(DateTime)

    def __repr__(self):
        return "<Account('%s', '%s')>" % (self.domain_id, self.domain_name)

class Resource(Base):
    __tablename__ = 'resource'
    domain_id = Column(String(255), primary_key=True,nullable=False)
    datasource_id = Column(String(36),primary_key=True,nullable=False)
    resource_id = Column(String(40),nullable=False)
    resource_name = Column(String(260),nullable=False)
    resource_type = Column(String(50))
    resource_size = Column(BigInteger)
    resource_owner_id = Column(String(320))
    last_modified_time = Column(DateTime)
    creation_time = Column(DateTime)
    exposure_type = Column(String(10))

    def __repr__(self):
        return "Resource('%s','%s', '%s', '%s')" % (self.domain_id,self.datasource_id,self.resource_id,self.resource_name)

class LoginUser(Base):
    __tablename__ = 'login_user'
    email = Column(String(320), primary_key=True)
    first_name = Column(String(35))
    last_name = Column(String(35))
    authtoken = Column(String(36))
    domain_id = Column(String(255))
    refreshtoken = Column(String(255))
    created_time = Column(DateTime)
    last_login_time = Column(DateTime)

