import ortc

class RealtimeConnection(object):
    ortc_client = None
    application_key = '9BQaOL'
    last_channel = None
    last_message = None

    def __init__(self):
        if not self.ortc_client:
            self.ortc_client = ortc.OrtcClient()
            self.ortc_client.cluster_url = "http://ortc-developers.realtime.co/server/2.1"

    def send(self, channel, message):
        try:
            self.last_message = None
            if not self.ortc_client.is_connected:
                self.ortc_client.set_on_connected_callback(self.on_connected)
                self.last_channel = channel
                self.last_message = message
                self.ortc_client.connect(self.application_key)
            else:
                self.ortc_client.send(self.channel, self.message)
                print "Tried to send message to realtime framework"
        except Exception as ex:
            print "Sending message to realtime framework failed with exception - " + ex
            
    def on_connected(self, sender):
        try:
            if self.last_message:
                self.ortc_client.send(self.last_channel, self.last_message)
                print "Tried to send message to realtime framework"
                self.last_message = None
        except Exception as ex:
            print "Sending message to realtime framework failed with exception - " + ex
