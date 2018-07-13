import json
from datetime import date, datetime

from sqlalchemy import (BigInteger, Boolean, Column, DateTime, Float,
                        ForeignKey, ForeignKeyConstraint, Integer, Sequence,
                        String, Text, and_)
from sqlalchemy.ext.declarative import DeclarativeMeta, declarative_base
from sqlalchemy.orm import relationship

from adya.common.constants import constants

Base = declarative_base()


def alchemy_encoder(fields_to_expand={"depth": 0}):
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
                            if fields_to_expand["depth"] == 0:
                                # this will fail on non-encodable values, like other classes
                                temp = json.dumps(data, cls=alchemy_encoder(
                                    fields_to_expand={"depth": 1}), check_circular=False)
                                fields[field] = json.loads(temp)
                        except TypeError as ex:
                            fields[field] = None
                    elif isinstance(data.__class__, DeclarativeMeta):
                        fields[field] = None
                    else:
                        try:
                            # this will fail on non-encodable values, like other classes
                            json.dumps(data)
                            fields[field] = data
                        except TypeError as ex:
                            fields[field] = None
                        except Exception as ex:
                            fields[field] = None
                # a json-encodable dict
                return fields
            return json.JSONEncoder.default(self, obj)

    return AlchemyEncoder


class Domain(Base):
    __tablename__ = 'domain'
    domain_id = Column(String(255), primary_key=True)
    domain_name = Column(String(255))
    creation_time = Column(DateTime)
    login_users = relationship("LoginUser", backref="domain")


class LoginUser(Base):
    __tablename__ = 'login_user'
    domain_id = Column(String(255), ForeignKey(
        'domain.domain_id'), primary_key=True)
    email = Column(String(320), primary_key=True)
    first_name = Column(String(255))
    last_name = Column(String(255))
    auth_token = Column(String(36))
    refresh_token = Column(String(255))
    is_serviceaccount_enabled = Column(Boolean, default=True)
    creation_time = Column(DateTime)
    last_login_time = Column(DateTime)
    authorize_scope_name = Column(String(50))
    token = Column(String(255))
    is_enabled = Column(Boolean, default=True)


class DataSource(Base):
    __tablename__ = 'datasource'
    domain_id = Column(String(255), ForeignKey(
        'domain.domain_id'))
    datasource_id = Column(String(36), primary_key=True)
    display_name = Column(String(255))
    datasource_type = Column(String(50))
    source_id = Column(String(255))
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
    is_dummy_datasource = Column(Boolean, default=False)
    is_async_delete = Column(Boolean, default=False)

class DatasourceCredentials(Base):
    __tablename__ = 'datasource_credentials'
    datasource_id = Column(String(36), ForeignKey(
        'datasource.datasource_id'), primary_key=True)
    credentials = Column(Text)
    created_user = Column(String(320))

class DatasourceScanners(Base):
    __tablename__ = 'datasource_scanners'
    id = Column(Integer, autoincrement=True, primary_key=True)
    datasource_id = Column(String(36), ForeignKey('datasource.datasource_id'), primary_key=True)
    channel_id = Column(String(100), primary_key=True)
    scanner_type = Column(String(50))
    user_email = Column(String(255))
    page_token = Column(String(225))
    total_count = Column(BigInteger, default=0)
    processed_count = Column(BigInteger, default=0)
    in_progress = Column(Boolean)
    stale = Column(Boolean)
    query_status = Column(Integer, default=0)
    process_status = Column(Integer, default=0)
    started_at = Column(DateTime)
    updated_at = Column(DateTime)
    expire_at = Column(DateTime)
    resource_id = Column(String(255))
    resource_uri = Column(String(255))

class PushNotificationsSubscription(Base):
    __tablename__ = 'push_notifications_subscription'
    domain_id = Column(String(255), ForeignKey('domain.domain_id'))
    datasource_id = Column(String(36), primary_key=True)
    channel_id = Column(String(100), primary_key=True)
    drive_root_id = Column(String(255))
    user_email = Column(String(255))
    page_token = Column(String(225))
    in_progress = Column(Boolean)
    stale = Column(Boolean)
    last_accessed = Column(DateTime)
    expire_at = Column(DateTime)
    resource_id = Column(String(255))
    resource_uri = Column(String(255))
    notification_type = Column(String(30))


class DomainUser(Base):
    __tablename__ = 'domain_user'
    datasource_id = Column(String(36), ForeignKey(
        'datasource.datasource_id'), primary_key=True)
    email = Column(String(320), primary_key=True)
    type = Column(String(50), default=constants.DirectoryEntityType.USER.value)
    # we can't put constraint for firstname and lastname null
    # because if we get External user from other domain provider that might not have Names
    first_name = Column(String(255))
    last_name = Column(String(255))
    full_name = Column(String(255))
    description = Column(Text)
    is_admin = Column(Boolean, default=False)
    creation_time = Column(DateTime)
    last_updated = Column(DateTime)
    is_suspended = Column(Boolean, default=False)
    user_id = Column(String(260))
    photo_url = Column(Text)
    aliases = Column(Text)
    member_type = Column(String(50))
    config = Column(Text)

    groups = relationship("DomainUser", secondary="domain_directory_structure",
                          primaryjoin="and_(DirectoryStructure.datasource_id==DomainUser.datasource_id, DomainUser.email==DirectoryStructure.member_email)",
                          secondaryjoin="and_(DirectoryStructure.datasource_id==DomainUser.datasource_id, DirectoryStructure.parent_email==DomainUser.email)")


class DirectoryStructure(Base):
    __tablename__ = 'domain_directory_structure'
    datasource_id = Column(String(36), primary_key=True)
    parent_email = Column(String(320), primary_key=True)
    member_email = Column(String(320), primary_key=True)
    member_id = Column(String(260))
    member_role = Column(String(10), nullable=False)
    member_type = Column(String(10), nullable=False)
    __table_args__ = (
        ForeignKeyConstraint(['datasource_id', 'parent_email'], [
            'domain_user.datasource_id', 'domain_user.email']),
    )


class DomainGroup(Base):
    __tablename__ = 'domain_group'
    datasource_id = Column(String(36), ForeignKey(
        'datasource.datasource_id'), primary_key=True)
    group_id = Column(String(260), nullable=False)
    email = Column(String(320), primary_key=True)
    name = Column(String(255))
    direct_members_count = Column(Integer, default=0)
    description = Column(Text)
    include_all_user = Column(Boolean, default=False)
    aliases = Column(Text)
    is_external = Column(Boolean, default=False)


class Resource(Base):
    __tablename__ = 'resource'
    datasource_id = Column(String(36), ForeignKey(
        'datasource.datasource_id'), primary_key=True)
    resource_id = Column(String(100), primary_key=True)
    resource_name = Column(String(260), nullable=False)
    resource_type = Column(String(50))
    resource_size = Column(BigInteger)
    resource_owner_id = Column(String(320))
    last_modified_time = Column(DateTime)
    creation_time = Column(DateTime)
    exposure_type = Column(String(30))
    web_content_link = Column(Text)
    web_view_link = Column(Text)
    icon_link = Column(Text)
    thumthumbnail_link = Column(Text)
    description = Column(Text)
    last_modifying_user_email = Column(String(255))
    parent_id = Column(String(100), nullable=True)
    permissions = relationship(
        "ResourcePermission", backref="resource")


class ResourceParent(Base):
    __tablename__ = 'resource_parent_table'
    domain_id = Column(String(255))
    datasource_id = Column(String(36))
    resource_id = Column(String(100), primary_key=True)
    email = Column(String(320), primary_key=True)
    parent_id = Column(String(260))


class ResourcePermission(Base):
    __tablename__ = 'resource_permission_table'
    datasource_id = Column(String(36), primary_key=True)
    resource_id = Column(String(100), primary_key=True)
    email = Column(String(320), primary_key=True)
    permission_id = Column(String(260), nullable=False)
    permission_type = Column(String(10))
    exposure_type = Column(String(30))
    expiration_time = Column(DateTime)
    is_deleted = Column(Boolean, default=False)
    __table_args__ = (
        ForeignKeyConstraint(['datasource_id', 'resource_id'], ['resource.datasource_id', 'resource.resource_id']),
    )


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
    datasource_id = Column(String(36), primary_key=True)
    initiated_by = Column(String(100))
    action_name = Column(String(200))
    parameters = Column(String(1000))
    affected_entity = Column(String(255))
    affected_entity_type = Column(String(100))
    timestamp = Column(DateTime)
    status = Column(String(50))
    message = Column(String(500))
    total_count = Column(Integer, default=0)
    success_count = Column(Integer, default=0)
    failed_count = Column(Integer, default=0)


class Application(Base):
    __tablename__ = 'application'
    id = Column(Integer, primary_key=True, autoincrement=True)
    domain_id = Column(String(255), ForeignKey(
        'domain.domain_id'))
    display_text = Column(String(255))
    anonymous = Column(Boolean, default=True)
    scopes = Column(Text)
    score = Column(Float)
    timestamp = Column(DateTime)
    inventory_app_id = Column(Integer, ForeignKey('app_inventory.id'), nullable=True)
    inventory_license_id = Column(Integer, nullable=True)
    unit_num = Column(Integer)
    unit_price = Column(Float)
    pricing_model = Column(String(36), default = constants.PricingModel.MONTHLY.value)
    billing_cycle = Column(String(36), default = constants.BillingCycle.MONTHLY.value)
    purchased_date = Column(DateTime)

class ApplicationUserAssociation(Base):
    __tablename__ = 'app_user_association'
    application_id = Column(Integer, ForeignKey('application.id'), primary_key=True)
    datasource_id = Column(String(36), ForeignKey('datasource.datasource_id'), primary_key=True)
    client_id = Column(String(255), primary_key=True)
    user_email = Column(String(320), primary_key=True)


def get_table(tablename):
    if tablename == 'resource':
        return Resource
    elif tablename == 'user':
        return DomainUser
    elif tablename == 'directory_structure':
        return DirectoryStructure
    elif tablename == 'resource_permission':
        return ResourcePermission
    elif tablename == 'application':
        return Application
    elif tablename == 'app_user_association':
        return ApplicationUserAssociation


class Alert(Base):
    __tablename__ = 'alert'
    alert_id = Column(String(255), primary_key=True)
    policy_id = Column(String(255), ForeignKey('policy.policy_id'))
    datasource_id = Column(String(36), ForeignKey('datasource.datasource_id'))
    name = Column(String(255))
    description_template = Column(Text)
    payload = Column(Text)
    created_at = Column(DateTime)
    severity = Column(String(255))
    isOpen = Column(Boolean)
    last_updated = Column(DateTime)
    number_of_violations = Column(Integer)


class Policy(Base):
    __tablename__ = 'policy'
    policy_id = Column(String(255), primary_key=True)
    datasource_id = Column(String(36), ForeignKey('datasource.datasource_id'))
    name = Column(String(255))
    description = Column(String(255))
    trigger_type = Column(String(200), index=True)
    created_by = Column(String(255))
    is_active = Column(Boolean, default=False)
    conditions = relationship(
        "PolicyCondition", backref="policy")
    actions = relationship(
        "PolicyAction", backref="policy")
    severity = Column(String(255), default="HIGH")


class PolicyCondition(Base):
    __tablename__ = 'policy_condition'
    id = Column(Integer, primary_key=True, autoincrement=True)
    policy_id = Column(String(255))
    datasource_id = Column(String(255))
    match_type = Column(String(255))
    match_condition = Column(String(255))
    match_value = Column(String(255))
    __table_args__ = (
        ForeignKeyConstraint(['datasource_id', 'policy_id'], [
            'policy.datasource_id', 'policy.policy_id']),
    )


class PolicyAction(Base):
    __tablename__ = 'policy_action'
    id = Column(Integer, primary_key=True, autoincrement=True)
    policy_id = Column(String(255))
    datasource_id = Column(String(255))
    action_type = Column(String(255))
    config = Column(Text)
    __table_args__ = (
        ForeignKeyConstraint(['datasource_id', 'policy_id'], [
            'policy.datasource_id', 'policy.policy_id']),
    )


class TrustedEntities(Base):
    __tablename__ = "trusted_entities"
    domain_id = Column(String(255), ForeignKey(
        'domain.domain_id'))
    id = Column(Integer, primary_key=True, autoincrement=True)
    trusted_domains = Column(Text)
    trusted_apps = Column(Text)


class AppInventory(Base):
    __tablename__ = "app_inventory"
    id = Column(Integer, primary_key=True,autoincrement=True)
    name = Column(String(255))
    desc_name = Column(String(255))
    description = Column(Text)
    category = Column(String(255))
    sub_category = Column(String(255))
    sub_sub_category = Column(String(255))
    rating = Column(Integer,default = 0)
    image_url = Column(Text)
    price_page_url = Column(Text)
    publisher_name = Column(String(255))
    publisher_url = Column(Text)
    applications = relationship("Application", backref="inventory")

class AppLicenseInventory(Base):
    __tablename__ = "app_license_inventory"
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255))
    app_id = Column(Integer, ForeignKey('app_inventory.id'), nullable=True)
    price = Column(Float,default=0.0) # in dollars
    billing_cycle = Column(String(50))
    max_users = Column(Integer,default=1)
    custom_plan = Column(Boolean, default=False)
    
# class DefaultActivities(Base):
#     __tablename__ = 'default_activities'
#     id = Column(Integer, primary_key=True, autoincrement=True)
#     datasource_type = Column(String(50))
#     activity_type = Column(String(255))
#     display_name = Column(String(255))
#     description = Column(Text)
#     description_template = Column(Text)

# class ActivitiesSettings(Base):
#     __tablename__ = 'activities_settings'
#     id = Column(Integer, primary_key=True, autoincrement=True)
#     default_activity_id = Column(Integer, ForeignKey('default_activities.id'))
#     datasource_id = Column(String(255), ForeignKey('datasource.datasource_id'))
#     is_enabled = Column(Boolean, default=False)
#     last_updated = Column(DateTime)


