from adya.common.constants import constants
from adya.common.utils import aws_utils, utils
from adya.common.db.connection import db_connection
from adya.common.db.models import LoginUser, DomainUser, Resource, DataSource
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
        login_user_first_name = login_user.first_name
        if not login_user:
            Logger().info("No user to send an email to, so aborting...")
            return

        template_name = "gdrive_scan_completed"
        template_parameters=get_gdrive_scan_summary(datasource,login_user_first_name,auth_token,None)
        rendered_html = get_rendered_html(template_name, template_parameters)

        # only to get admin users
        all_admin_user_for_a_domain = session.query(DomainUser).filter(and_(DomainUser.datasource_id == datasource.datasource_id,
                                                                           DomainUser.is_admin == True)).all()

        user_list = set()
        if all_admin_user_for_a_domain:
            for user in all_admin_user_for_a_domain:
                user_list.add(user.email)

        user_list.add(login_user.email)
        email_subject="Your gdrive scan has completed!"
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
            if item[0] == constants.DocType.DOMAIN_COUNT:
                countDomainSharedDocs = item[1]
            elif item[0] == constants.DocType.EXTERNAL_COUNT:
                countExternalSharedDocs = item[1]
            elif item[0] == constants.DocType.PUBLIC_COUNT:
                countPublicSharedDocs = item[1]
            elif item[0] == constants.DocType.ANYONE_WITH_LINK_COUNT:
                countAnyoneWithLinkSharedDocs = item[1]

        #countDocuments = countDomainSharedDocs + countExternalSharedDocs + countPublicSharedDocs + countAnyoneWithLinkSharedDocs
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
        usersCount = datasource.total_user_count
        groupsCount = datasource.total_group_count
        appsCount = apps["totalCount"]
        highRiskAppsCount = apps["rows"]["High Risk"]

        data = {
            "domainId": domainId,
            #"countDocuments": countDocuments,
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


def send_clean_files_email(datasource_id,user_email):
    try:
        if not datasource_id:
            return "Invalid datasource! Aborting..."
        db_session = db_connection().get_session()
        datasource = db_session.query(DataSource).filter(and_(DataSource.datasource_id == datasource_id, DataSource.is_async_delete == False)).first()
        template_name = "clean_files"
        template_parameters=get_gdrive_scan_summary(datasource,None,user_email)
        rendered_html = get_rendered_html(template_name, template_parameters)
        email_subject="CleanUp Your Files!"
        aws_utils.send_email([user_email], email_subject, rendered_html)
        return True
    except Exception as e:
        Logger().exception("Exception occurred sending clean files email")
        return False

def send_policy_violate_email(user_email,policy,resource):
    try:
        template_name = "policy_violation"
        template_parameters = {
            "policy_name": policy.name,
            "document_name": resource["resource_name"],
            "modifying_user": resource["last_modifying_user_email"]
        }
        rendered_html = get_rendered_html(template_name, template_parameters)
        email_subject = "Policy Violated"
        aws_utils.send_email([user_email], email_subject, rendered_html)
        return True
    except Exception as e:
        Logger.exception("Exception occured while sending policy violation email")
        return False


