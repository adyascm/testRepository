import openPopup from './popup'
import agent from './agent';

import {
    API_ROOT
} from '../constants/actionTypes';

function listenForCredentials (popup, resolve, reject) {
    if (!resolve) {
      return new Promise((resolve, reject) => {
        listenForCredentials(popup, resolve, reject);
      });

    } else {
      let email,token,error;

      try {
        let params = (new URL(popup.location)).searchParams;
        email =params.get("email");
        token =params.get("authtoken");
        error =params.get("error");
      } catch (err) {}

      if (email && token) {
        popup.close();
        agent.setToken(token);
        let currentUser = agent.Auth.current();
        resolve({"token": token, "payload": currentUser});
      } else if(error) {
        popup.close();
        reject({errors: {Failed: error}});
      }else if (popup.closed) {
        reject({errors: {Failed:"Authentication was cancelled."}})
      } else {
        setTimeout(() => {
          listenForCredentials(popup, resolve, reject);
        }, 50);
      }
    }
  }

function authenticateGsuite(scope) {
    var url = API_ROOT + "/google/oauthlogin?scope=" + scope;
    let popup = openPopup(url, "_blank");
    return listenForCredentials(popup);
  }

function authenticateSlack(scope, authtoken) {
      var url = API_ROOT + "/slack/oauthlogin?scope=" + scope + "&authtoken="+ authtoken;
      let popup = openPopup(url, "_blank");
      return listenForCredentials(popup);
    }
  
function authenticateGithub(authToken) {
  var url = API_ROOT + "/github/oauthlogin?authToken=" + authToken
  let popup = openPopup(url, "_blank")
  return listenForCredentials(popup)
}

export default {authenticateGsuite, authenticateSlack, authenticateGithub}
