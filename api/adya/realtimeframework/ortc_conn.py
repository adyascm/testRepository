import ortc

application_key = '9BQaOL'


class RealtimeConnection(object):
    ortc_client = None

    def __init__(self):
        if not RealtimeConnection.ortc_client:
            RealtimeConnection.ortc_client = ortc.OrtcClient()
            RealtimeConnection.ortc_client.cluster_url = "http://ortc-developers.realtime.co/server/2.1"
            RealtimeConnection.ortc_client.connect(application_key)

    def get_conn(self):
        return RealtimeConnection.ortc_client

# ortc_client=realtime_connection().get_conn()
# Usage: ortc_client.send($queName, msg)
