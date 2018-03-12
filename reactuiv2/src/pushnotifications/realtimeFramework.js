//import React from 'react';
import Realtime from 'realtime-messaging';
import {SCAN_UPDATE_RECEIVED, SCAN_INCREMENTAL_UPDATE_RECEIVED} from '../constants/actionTypes'


const initializePushNotifications = (props, datasource) => {
  Realtime.loadOrtcFactory(Realtime.IbtRealTimeSJType, (factory, error) => {
    if(!error) {
      this.realtime = factory.createClient();

      this.realtime.onConnected = (client) => {
        // subscribe a channel to receive messages
        client.subscribe("adya-scan-update", true, (conn, channel, msg) => {
          // console.log("Message received on adya-scan-update channel - " + msg);
          props.onPushNotification(SCAN_UPDATE_RECEIVED, msg);
        });

        client.subscribe("adya-"+datasource.datasource_id, true, (conn, channel, msg) => {
          props.onPushNotification(SCAN_INCREMENTAL_UPDATE_RECEIVED, msg);
        });
      }

      this.realtime.setClusterUrl("https://ortc-developers.realtime.co/server/ssl/2.1/");
      this.realtime.connect('QQztAk', 'token');
    }
  });
}


export default initializePushNotifications;
