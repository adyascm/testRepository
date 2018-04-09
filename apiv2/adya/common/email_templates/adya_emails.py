from adya.common.constants import constants
from adya.common.utils import aws_utils, utils
from adya.common.db.connection import db_connection
from adya.common.db.models import LoginUser, DomainUser, Resource, DataSource
from adya.core.controllers import reports_controller
from sqlalchemy import or_, and_
import pystache
import os


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
        print e
        print "Exception occurred while rendering html."

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
        print e
        print "Exception occurred sending welcome email!"

def send_gdrive_scan_completed_email(datasource):
    try:
        if not datasource:
            return "Invalid datasource! Aborting..."

        template_name = "gdrive_scan_completed"
        template_parameters=get_gdrive_scan_completed_parameters(datasource)
        rendered_html = get_rendered_html(template_name, template_parameters)
        user_list = [template_parameters['email']]
        email_subject="Your gdrive scan has completed!"
        aws_utils.send_email(user_list, email_subject, rendered_html)
    except Exception as e:
        print e
        print "Exception occurred sending gdrive scan completed email"


def get_gdrive_scan_completed_parameters(datasource):
    try:
        if not datasource:
            return "Invalid datasource! Aborting..."

        session = db_connection().get_session()
        users_query = session.query(LoginUser).filter(and_(LoginUser.domain_id == datasource.domain_id, LoginUser.is_enabled == True))
        #if datasource.is_serviceaccount_enabled:
        #    users_query = users_query.filter(LoginUser.is_admin_user)
        all_users = users_query.all()
        
        if len(all_users) < 1:
            print "No user to send an email to, so aborting..."
            return
        emails = ",".join(user.email for user in all_users)
        countSharedDocumentsByType = reports_controller.get_widget_data(all_users[0].auth_token, "sharedDocsByType")['rows']

        countDomainSharedDocs = 0
        countExternalSharedDocs = 0
        countPublicSharedDocs = 0

        for item in countSharedDocumentsByType:
            if item[0] == constants.DocType.DOMAIN_COUNT:
                countDomainSharedDocs = item[1]
            elif item[0] == constants.DocType.EXTERNAL_COUNT:
                countExternalSharedDocs = item[1]
            elif item[0] == constants.DocType.PUBLIC_COUNT:
                countPublicSharedDocs = item[1]

        countDocuments = countDomainSharedDocs + countExternalSharedDocs + countPublicSharedDocs
        externalDocsListData = reports_controller.get_widget_data(all_users[0].auth_token, "sharedDocsList")
        externalUserListData = reports_controller.get_widget_data(all_users[0].auth_token, "externalUsersList")

        trial_link = constants.UI_HOST

        externalDocs = convert_list_pystache_format("name", externalDocsListData["rows"])
        externalUsers = convert_list_pystache_format("name", externalUserListData["rows"])
        restFiles = externalDocsListData["totalCount"] - len(externalDocsListData["rows"])
        restUsers = externalUserListData["totalCount"] - len(externalUserListData["rows"])

        data = {
            "countDocuments": countDocuments,
            "countExternalData": countExternalSharedDocs,
            "countLinkData": countPublicSharedDocs,
            "externalDocs": externalDocs,
            "documentsCountData": externalDocsListData["totalCount"],
            "externalUsers": externalUsers,
            "countExternalUsersData": externalUserListData["totalCount"],
            "email": emails,
            "countDomainData": countDomainSharedDocs,
            "trialLink": trial_link,
            "restFiles": "...and " + str(restFiles) + " other documents" if restFiles > 0 else "",
            "restUsers": "...and " + str(restUsers) + " other external users" if restUsers > 0 else ""
        }

        return data

    except Exception as e:
        print e
        print "Exception occurred retrieving data for gdrive scan completed email."


def convert_list_pystache_format(placeholder, list_items):
    pystache_list = []
    for item in list_items:
        temp_map = {}
        temp_map[placeholder] = item[0]
        pystache_list.append(temp_map)

    return pystache_list


