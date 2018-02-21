from adya.common import aws_utils, constants, utils
from adya.db.connection import db_connection
from adya.db.models import LoginUser, DomainUser, Resource
from adya.controllers import reports_controller
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


def send_email(auth_token, email_type, params):
    try:
        if not auth_token:
            return "Invalid auth_token! Aborting..."

        if not email_type:
            return "Invalid request, email_type not specified."

        if email_type == "gdrive_scan_completed":
            return send_gdrive_scan_completed_email(auth_token)
        elif email_type == "welcome":
            return send_welcome_email(auth_token)

    except Exception as e:
        print e
        print "Exception occurred sending email."


def send_welcome_email(auth_token):
    try:
        if not auth_token:
            return "Invalid auth_token! Aborting..."


        template_name = "welcome"
        template_parameters = get_welcome_parameters(auth_token)
        rendered_html = get_rendered_html(template_name, template_parameters)
        user_list = [template_parameters['email']]
        email_subject = "Welcome to Adya!"
        aws_utils.send_email(user_list, email_subject, rendered_html)
    except Exception as e:
        print e
        print "Exception occurred sending welcome email!"


def get_welcome_parameters(auth_token):
    try:
        if not auth_token:
            return "Invalid auth_token! Aborting..."

        session = db_connection().get_session()
        email = session.query(LoginUser).filter(LoginUser.auth_token == auth_token).first().email
        user = session.query(DomainUser.first_name, DomainUser.last_name).filter(DomainUser.email == email).first()

        first_name = ""
        last_name = ""
        if user:
            first_name = user[0]
            last_name = user[1]

        data = {
            "first_name" : first_name,
            "last_name" : last_name,
            "email" : email
        }

        return data

    except Exception as e:
        print e
        print "Exception occurred sending welcome email!"


def send_gdrive_scan_completed_email(auth_token):
    try:
        if not auth_token:
            return "Invalid auth_token! Aborting..."

        template_name = "gdrive_scan_completed"
        template_parameters=get_gdrive_scan_completed_parameters(auth_token)
        rendered_html = get_rendered_html(template_name, template_parameters)
        user_list = [template_parameters['email']]
        email_subject="Your gdrive scan has completed!"
        aws_utils.send_email(user_list, email_subject, rendered_html)
    except Exception as e:
        print e
        print "Exception occurred sending gdrive scan completed email"


def get_gdrive_scan_completed_parameters(auth_token):
    try:
        if not auth_token:
            return "Invalid auth_token! Aborting..."

        session = db_connection().get_session()

        countDocuments = session.query(Resource).filter(
            and_(Resource.domain_id == LoginUser.domain_id)).filter(LoginUser.auth_token == auth_token).count()

        countSharedDocumentsByType = reports_controller.get_widget_data(auth_token, "sharedDocsByType")

        print countSharedDocumentsByType
        countDomainSharedDocs = 0
        countExternalSharedDocs = 0
        countInternalSharedDocs = 0
        countPublicSharedDocs = 0

        for item in countSharedDocumentsByType:
            if item[0] == constants.ResourceExposureType.DOMAIN:
                countDomainSharedDocs = item[1]
            elif item[0] == constants.ResourceExposureType.EXTERNAL:
                countExternalSharedDocs = item[1]
            elif item[0] == constants.ResourceExposureType.INTERNAL:
                countInternalSharedDocs = item[1]
            elif item[0] == constants.ResourceExposureType.PUBLIC:
                countPublicSharedDocs = item[1]

        externalDocsListData = reports_controller.get_widget_data(auth_token, "sharedDocsList")
        externalUserListData = reports_controller.get_widget_data(auth_token, "externalUsersList")

        email = session.query(LoginUser).filter(LoginUser.auth_token == auth_token).first().email

        trial_link = constants.UI_HOST

        externalDocs = convert_list_pystache_format("name", externalDocsListData["rows"])
        externalUsers = convert_list_pystache_format("name", externalUserListData["rows"])

        data = {
            "countDocuments": countDocuments,
            "countExternalData": countExternalSharedDocs,
            "countInternalData": countInternalSharedDocs,
            "countLinkData": countPublicSharedDocs,
            "externalDocs": externalDocs,
            "documentsCountData": externalDocsListData["totalCount"],
            "externalUsers": externalUsers,
            "countExternalUsersData": externalUserListData["totalCount"],
            "email": email,
            "countDomainData": countDomainSharedDocs,
            "trialLink": trial_link

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


