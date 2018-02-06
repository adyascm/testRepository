import urlparse

from flask_restful import Resource, reqparse, request
from adya.controllers import reports_controller


class dashboard_widget(Resource):
    def get(self):
        req = request
        auth_token = req.headers.get('Authorization')
        if not auth_token:
            return {'message': 'Missing auth token'}, 400
        widget_id = request.args["widgetId"]
        data = reports_controller.get_widget_data(auth_token, widget_id)
        return data, 200
