from adya.gsuite.synchronizers import incremental_scan, drive_change_notification, activity_notification
from adya.common.utils.request_session import RequestSession


def subscribe(event, context):
    req_session = RequestSession(event)
    req_error = req_session.validate_authorized_request(True, ["domainId", "dataSourceId"])
    if req_error:
        return req_error

    incremental_scan.subscribe(req_session.get_req_param('domainId'), req_session.get_req_param('dataSourceId'))
    return req_session.generate_response(202, "Subscription successful")


def process_drive_notifications(event, context):
    req_session = RequestSession(event)
    req_error = req_session.validate_authorized_request(False, mandatory_params=[], optional_params=[],
                                                        headers=['X-Goog-Channel-Token', 'X-Goog-Channel-ID',
                                                                    'X-Goog-Resource-State'])
    if req_error:
        return req_error

    datasource_id = req_session.get_req_header('X-Goog-Channel-Token')
    channel_id = req_session.get_req_header('X-Goog-Channel-ID')
    notification_type = req_session.get_req_header('X-Goog-Resource-State')
    drive_change_notification.process_notifications(notification_type, datasource_id, channel_id)
    return req_session.generate_response(202)

def process_activity_notifications(event, context):
    req_session = RequestSession(event)
    req_error = req_session.validate_authorized_request(False, mandatory_params=[], optional_params=[], headers=['X-Goog-Channel-Token', 'X-Goog-Channel-ID', 'X-Goog-Resource-State'])
    if req_error:
        return req_error

    datasource_id = req_session.get_req_header('X-Goog-Channel-Token')
    channel_id = req_session.get_req_header('X-Goog-Channel-ID')
    notification_type = req_session.get_req_header('X-Goog-Resource-State')
    activity_notification.process_notifications(notification_type, datasource_id, channel_id, req_session.get_body())
    return req_session.generate_response(202)

def handle_channel_expiration(event, context):
    req_session = RequestSession(event)
    req_error = req_session.validate_authorized_request(False, optional_params=['page_num'])
    if req_error:
        return req_error

    response = incremental_scan.handle_channel_expiration(req_session.get_req_param('page_num'))
    return req_session.generate_response(202, response)

def poll_changes(event, context):
    req_session = RequestSession(event)
    req_error = req_session.validate_authorized_request(False, optional_params=['datasource_id'])
    if req_error:
        return req_error

    incremental_scan.gdrive_periodic_changes_poll(req_session.get_req_param('datasource_id'))
    return req_session.generate_response(200)