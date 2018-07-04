from influxdb import InfluxDBClient
from influxdb import SeriesHelper
from adya.common.constants import constants
class activity_db:
    class __activity_db:
        _client = None
        def __init__(self):
            self._client = InfluxDBClient(constants.ACTIVITY_DB_HOST, constants.ACTIVITY_DB_PORT, constants.ACTIVITY_DB_USERNAME, constants.ACTIVITY_DB_PWD, constants.ACTIVITY_DB_NAME)
        
        def get_client(self):
            return self._client


    instance = None
    def __init__(self):
        if not activity_db.instance:
            activity_db.instance = activity_db.__activity_db()
    def __getattr__(self, name):
        return getattr(self.instance, name)

class ConnectorEvent(SeriesHelper):
    """Instantiate SeriesHelper to write points to the backend."""

    class Meta:
        """Meta class stores time series helper configuration."""

        # The client should be an instance of InfluxDBClient.
        client = activity_db().get_client()

        # The series name must be a string. Add dependent fields/tags
        # in curly brackets.
        series_name = 'events'

        # Defines all the fields in this time series.
        fields = ['event']

        # Defines all the tags for the series.
        tags = ['domain_id', 'datasource_id', 'ds_type', 'event_type', 'actor']

        # Defines the number of data points to store prior to writing
        # on the wire.
        bulk_size = 1

        # autocommit must be set to True when using bulk_size
        autocommit = True