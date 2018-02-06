import React from 'react';
import Realtime from 'realtime-messaging';

const initialize = (queueName,handle_msg) => {
  Realtime.loadOrtcFactory(Realtime.IbtRealTimeSJType, (factory, error) => {
    if(!error) {
      this.realtime = factory.createClient();

      this.realtime.onConnected = (client) => {
        console.log("realtime connected");

        // subscribe a channel to receive messages
        client.subscribe(queueName, true, handle_msg);
      }

      this.realtime.setClusterUrl("http://ortc-developers.realtime.co/server/2.1/");
      this.realtime.connect('9BQaOL', 'token');
    }
  });
}


export default initialize;
