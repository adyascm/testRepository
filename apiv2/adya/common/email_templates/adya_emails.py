from adya.common.constants import constants
from adya.common.utils import aws_utils, utils
from adya.common.db.connection import db_connection
from adya.common.db.models import LoginUser, DomainUser, Resource, DataSource, ResourcePermission
from adya.core.controllers import reports_controller
from sqlalchemy import or_, and_
import pystache
import os
from adya.common.utils.response_messages import Logger

def get_rendered_html(template_name, template_parameters):
    try:
        template_path = os.path.join(os.path.dirname(__file__), template_name, "template.html")
        with open(template_path) as f:
            rendered_html = pystache.render(f.read(), template_parameters)
            if rendered_html:
                return rendered_html
            else:
                raise Exception()

    except Exception as e:
        Logger().exception("Exception occurred while rendering html.")

def send_welcome_email(login_user):
    try:
        if not login_user:
            return "Invalid user! Aborting..."


        template_name = "welcome"
        template_parameters = {
            "first_name" : login_user.first_name,
            "last_name" : login_user.last_name,
            "email" : login_user.email
        }
        rendered_html = get_rendered_html(template_name, template_parameters)
        user_list = [template_parameters['email']]
        email_subject = "Welcome to Adya!"
        aws_utils.send_email(user_list, email_subject, rendered_html)
    except Exception as e:
        Logger().exception("Exception occurred sending welcome email!")

def send_gdrive_scan_completed_email(auth_token, datasource):
    try:
        if not datasource:
            return "Invalid datasource! Aborting..."

        session = db_connection().get_session()
        login_user = session.query(LoginUser).filter(and_(LoginUser.auth_token == auth_token, LoginUser.is_enabled == True)).first()
        if not login_user:
            Logger().info("No user to send an email to, so aborting...")
            return
        login_user_first_name = login_user.first_name
        template_name = "gdrive_scan_completed"
        template_parameters=get_gdrive_scan_summary(datasource,login_user_first_name,auth_token,None)
        rendered_html = get_rendered_html(template_name, template_parameters)

        # only to get admin users
        # all_admin_user_for_a_domain = session.query(DomainUser).filter(and_(DomainUser.datasource_id == datasource.datasource_id,
        #                                                                    DomainUser.is_admin == True)).all()

        user_list = set()
        # if all_admin_user_for_a_domain:
        #     for user in all_admin_user_for_a_domain:
        #         user_list.add(user.email)
        user_list.add(login_user.email)

        user_list = list(user_list)
        Logger().info("send_gdrive_scan_completed_email : user email list : {}".format(user_list))

        email_subject="[Adya] Your GSuite account is ready for review"
        aws_utils.send_email(user_list, email_subject, rendered_html)
    except Exception as e:
        Logger().exception("Exception occurred sending gdrive scan completed email")


def get_gdrive_scan_summary(datasource,login_user_first_name,auth_token=None,user_email=None):
    try:
        if not datasource:
            return "Invalid datasource! Aborting..."
        countSharedDocumentsByType = reports_controller.get_widget_data(auth_token, "sharedDocsByType",datasource.datasource_id,user_email)['rows']

        countDomainSharedDocs = 0
        countExternalSharedDocs = 0
        countPublicSharedDocs = 0
        countAnyoneWithLinkSharedDocs = 0

        for item in countSharedDocumentsByType:
            if item[0] == constants.DocType.DOMAIN_COUNT.value:
                countDomainSharedDocs = item[1]
            elif item[0] == constants.DocType.EXTERNAL_COUNT.value:
                countExternalSharedDocs = item[1]
            elif item[0] == constants.DocType.PUBLIC_COUNT.value:
                countPublicSharedDocs = item[1]
            elif item[0] == constants.DocType.ANYONE_WITH_LINK_COUNT.value:
                countAnyoneWithLinkSharedDocs = item[1]

        countDocuments = countDomainSharedDocs + countExternalSharedDocs + countPublicSharedDocs + countAnyoneWithLinkSharedDocs
        externalDocsListData = reports_controller.get_widget_data(auth_token,"sharedDocsList", datasource.datasource_id,user_email)
        externalUserListData = reports_controller.get_widget_data(auth_token,"externalUsersList", datasource.datasource_id,user_email)
        filesCount = reports_controller.get_widget_data(auth_token, "filesCount", datasource.datasource_id, user_email)
        folderCount = reports_controller.get_widget_data(auth_token, "foldersCount", datasource.datasource_id, user_email)
        apps = reports_controller.get_widget_data(auth_token, "userAppAccess", datasource.datasource_id, user_email)
        internalUserExposed = reports_controller.get_widget_data(auth_token, "internalUserList", datasource.datasource_id, user_email)

        trial_link = constants.UI_HOST

        #externalUsers = convert_list_pystache_format("name", externalUserListData["rows"])
        #restFiles = externalDocsListData["totalCount"] - len(externalDocsListData["rows"])
        #restUsers = externalUserListData["totalCount"] - len(externalUserListData["rows"])

        domainId = datasource.domain_id
        usersCount = datasource.processed_user_count
        groupsCount = datasource.processed_group_count
        appsCount = apps["totalCount"]
        highRiskAppsCount = apps["rows"]["High Risk"]

        data = {
            "domainId": domainId,
            "countDocuments": countDocuments,
            #"countExternalData": countExternalSharedDocs,
            "countPublicData": countPublicSharedDocs,
            "externalDocs": externalDocsListData['totalCount'],
            #"documentsCountData": externalDocsListData["totalCount"],
            #"externalUsers": externalUsers,
            "countExternalUsersData": externalUserListData["totalCount"],
            "countDomainData": countDomainSharedDocs,
            "countAnyoneWithLinkData": countAnyoneWithLinkSharedDocs,
            "filesCount": filesCount,
            "folderCount": folderCount,
            "usersCount": usersCount,
            "groupsCount": groupsCount,
            "appsCount": appsCount,
            "highRiskAppsCount": highRiskAppsCount,
            "internalUserExposed": internalUserExposed["totalCount"],
            #"trialLink": trial_link,
            "loginUser": login_user_first_name,
            #"restFiles": "...and " + str(restFiles) + " other documents" if restFiles > 0 else "",
            #"restUsers": "...and " + str(restUsers) + " other external users" if restUsers > 0 else ""
        }

        return data

    except Exception as e:
        Logger().exception("Exception occurred retrieving data for gdrive scan completed email.")


def convert_list_pystache_format(placeholder, list_items):
    pystache_list = []
    for item in list_items:
        temp_map = {}
        temp_map[placeholder] = item[0]
        pystache_list.append(temp_map)

    return pystache_list


def send_clean_files_email(datasource_id,user_email,full_name,initiated_by):
    try:
        if not datasource_id:
            return "Invalid datasource! Aborting..."
        db_session = db_connection().get_session()
        datasource = db_session.query(DataSource).filter(DataSource.datasource_id == datasource_id).first()
        login_user = db_session.query(LoginUser).filter(LoginUser.domain_id == datasource.domain_id, LoginUser.email == initiated_by).first()
        admin_user = login_user.first_name + " " + login_user.last_name
        
        template_name = "clean_files"
        template_parameters = {
            "user_name": full_name,
            "admin_user": admin_user,
            "user_first_name": full_name.split(" ")[0]
        }
        rendered_html = get_rendered_html(template_name, template_parameters)
        email_subject="Please log in to Adya to manage your G Suite data"
        aws_utils.send_email([user_email], email_subject, rendered_html)
        return True
    except Exception as e:
        Logger().exception("Exception occurred sending clean files email")
        return False


def send_permission_change_policy_violate_email(user_email,policy,resource,new_permissions, violated_permissions, new_permissions_left):
    try:
        db_session = db_connection().get_session()
        resource_owner = db_session.query(DomainUser).filter(resource["datasource_id"] == DomainUser.datasource_id, DomainUser.email == resource["resource_owner_id"]).first()
        template_name = "permission_change_policy_violation"
        is_public = False
        is_link_shared = False
        permission_link = ''
        permissions_internal = []
        permissions_external = []
        for permission in new_permissions:
            user_name = permission["email"]
            permission_str = user_name + " (" + constants.permission_friendly_name_map[permission["permission_type"]] + ")"
            if permission["exposure_type"] == constants.EntityExposureType.PUBLIC.value:
                is_public = True
                permission_link = permission_str
            elif permission["exposure_type"] == constants.EntityExposureType.ANYONEWITHLINK.value:
                is_link_shared = True
                permission_link = permission_str
            elif permission["exposure_type"] == constants.EntityExposureType.EXTERNAL.value:
                permissions_external.append(permission_str)
            elif permission["exposure_type"] == constants.EntityExposureType.INTERNAL.value:
                permissions_internal.append(permission_str)

        violated_perm = []
        if violated_permissions:
            for violated_permission in violated_permissions:
                user_name = violated_permission["email"]
                violated_perm_str = user_name + " (" + constants.permission_friendly_name_map[
                    violated_permission["permission_type"]] + ")"
                violated_perm.append(violated_perm_str)

        new_perm_left = []
        for perm_left in new_permissions_left:
            user_name = perm_left["email"]
            permission_str = user_name + " (" + constants.permission_friendly_name_map[
                perm_left["permission_type"]] + ")"
            new_perm_left.append(permission_str)

        template_parameters = {
            "policy_name": policy.name,
            "document_name": resource["resource_name"],
            "modifying_user": resource["last_modifying_user_email"],
            "owner_name": resource_owner.first_name,
            "permissions_internal": permissions_internal,
            "has_permissions_internal": True if len(permissions_internal) > 0 else False,
            "permissions_ext": permissions_external,
            "has_permissions_ext": True if len(permissions_external) > 0 else False,
            "is_public": is_public,
            "is_link_shared": is_link_shared,
            "permission_link": permission_link,
            "revert_back": True if violated_permissions else False,
            "violated_permissions": violated_perm,
            "len_violated_permissions": True if (violated_permissions and len(violated_permissions)> 0) else False,
            "new_permissions_left": new_perm_left,
            "new_permissions_str": "New permissions for this document are - " if len(new_perm_left) > 0 else ""
        }
        rendered_html = get_rendered_html(template_name, template_parameters)
        email_subject = "[Adya] A policy is violated in your GSuite account"
        aws_utils.send_email([user_email], email_subject, rendered_html)
        return True
    except Exception as e:
        Logger().exception("Exception occured while sending policy violation email")
        return False


def send_app_install_policy_violate_email(user_email,policy,application, is_reverted):
    try:
        datasource_name = (policy.name).split("::")[0] if policy.name else None
        template_name = "app_install_policy_violation"
        template_parameters = {
            "policy_name": policy.name,
            "app_name": application["display_text"],
            "user_name":application["user_email"],
            "is_reverted": is_reverted
        } 
        rendered_html = get_rendered_html(template_name, template_parameters)
        email_subject = "[Adya] A policy is violated in your {} account".format(datasource_name)
        aws_utils.send_email([user_email], email_subject, rendered_html)
        return True
    except Exception as e:
        Logger().exception("Exception occured while sending app install policy violation email")
        return False
       

def send_new_user_policy_violate_email(user_email, policy, new_user, group_name):
    try:
        datasource_name = (policy.name).split("::")[0] if policy.name else None
        user_type =  "Administrator" if new_user['is_admin'] else ("external_user" if (new_user['member_type'] ==
                                                        constants.EntityExposureType.EXTERNAL.value) else None)
        template_name = "new_administrator_policy_violation" if (user_type == "Administrator") else \
                            ("add_external_user_policy_violation" if (user_type == "external_user") else None)
        template_parameters = {
            "policy_name": policy.name,
            "user_email": new_user["email"],
            "datasource_name": datasource_name,
            "group_name": group_name,
            "added_entity_type": "team" if datasource_name == constants.ConnectorTypes.SLACK.value else "group"
        }
        rendered_html = get_rendered_html(template_name, template_parameters)
        email_subject = "[Adya] A policy is violated in your {} account".format(datasource_name)
        aws_utils.send_email([user_email], email_subject, rendered_html)
        return True
    except Exception as e:
        Logger().exception("Exception occured while sending new user policy violation email")
        return False


def send_weekly_summary_email(email_list, response, domain_id):
    try:
        template_parameters = {
            "total_files": response.get('TOTAL_FILES'),
            "apps_installed": response.get('OAUTH_GRANT'),
            "publically_exposed_files": response.get('FILE_SHARE_PUBLIC'),
            "extenally_exposed_files": response.get('FILE_SHARE_EXTERNAL'),
            "users_created": response.get('CREATE_USER'),
            "total_users": response.get('TOTAL_USERS'),
            "from_date": response.get('from_date').strftime('%m/%d/%Y'),
            "to_date": response.get('to_date').strftime('%m/%d/%Y')
        }
        template_name = "weekly_summary"
        rendered_html = get_rendered_html(template_name, template_parameters)
        email_subject = "Weekly Summary for your {} account".format(domain_id)
        aws_utils.send_email_with_html_and_attachement(email_list, response.get('csv_records'), email_subject, response['report_name'], rendered_html)
    except Exception as ex:
        Logger().exception("Exception occured while sending weekly summary for account {}".format(domain_id))
        return False


