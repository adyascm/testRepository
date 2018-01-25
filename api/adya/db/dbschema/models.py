from sqlalchemy import Column, Sequence, Integer, String, DateTime
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()


class Account(Base):
    __tablename__ = 'account'
    domain_id = Column(String(255), primary_key=True)
    domain_name = Column(String(255))
    create_time = Column(DateTime)

    def __repr__(self):
        return "<Account('%s', '%s')>" % (self.domain_id, self.domain_name)


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






