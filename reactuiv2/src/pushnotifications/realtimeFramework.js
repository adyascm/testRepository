import React from 'react';
import Realtime from 'realtime-messaging';
import {SCAN_UPDATE_RECEIVED} from '../constants/actionTypes'


const initializePushNotifications = (props) => {
  Realtime.loadOrtcFactory(Realtime.IbtRealTimeSJType, (factory, error) => {
    if(!error) {
      this.realtime = factory.createClient();

      this.realtime.onConnected = (client) => {
        console.log("realtime connected");

        // subscribe a channel to receive messages
        client.subscribe("adya-scan-update", true, (conn, channel, msg) => {
          //console.log("Message received on adya-scan-update channel - " + msg);
          props.onPushNotification(SCAN_UPDATE_RECEIVED, msg);
        });
      }

      this.realtime.setClusterUrl("http://ortc-developers.realtime.co/server/2.1/");
      this.realtime.connect('QQztAk', 'token');
    }
  });
}


export default initializePushNotifications;
