from adya.datasources.google import gutils
from adya.common import errormessage


def get_applicationDataTransfers_for_gdrive(domain_id, datatransfer_service):
    try:

        results = datatransfer_service.applications().list(maxResults=10).execute()
        applications = results.get('applications', [])

        applicationDataTransfers = [{"applicationId": 0, "applicationTransferParams": {}}]
        if not applications:
            print('No applications found.')
        else:
            print('Applications:')
            for application in applications:
                print('{0} ({1})'.format(application['name'], application['id']))
                if application['name'] == 'Drive and Docs':
                    applicationDataTransfers[0]['applicationId'] = application['id']
                    applicationDataTransfers[0]['applicationTransferParams'] = application['transferParams']

        return applicationDataTransfers

    except Exception as e:
        print e
        print "Exception occurred while getting applications for domain: ", domain_id


def transfer_ownership(domain_id, old_user_email, new_user_email):
    try:
        datatransfer_service = gutils.get_gdrive_datatransfer_service(domain_id=domain_id)

        if datatransfer_service:
            print "Got datatransfer service!"

        print "Initiating data transfer..."
        applicationDataTransfers = get_applicationDataTransfers_for_gdrive(domain_id, datatransfer_service)

        directory_service = gutils.get_directory_service(domain_id=domain_id)
        old_user_id = directory_service.users().get(userKey=old_user_email).execute()
        old_user_id = old_user_id.get('id')
        new_user_id = directory_service.users().get(userKey = new_user_email).execute()
        new_user_id = new_user_id.get('id')


        transfersResource = { "oldOwnerUserId" : old_user_id, "newOwnerUserId": new_user_id,
                              "applicationDataTransfers": applicationDataTransfers}

        response = datatransfer_service.transfers().insert(body=transfersResource).execute()
        print response
        # handle failure in response
        return errormessage.ACTION_EXECUTION_SUCCESS

    except Exception as e:
        print e
        print "Exception occurred while transferring ownership from ", old_user_id, " to ", new_user_id, " on domain: ", domain_id


