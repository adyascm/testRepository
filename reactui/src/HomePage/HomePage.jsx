import React, { Component } from 'react';
import { StyleSheet, css } from 'aphrodite/no-important';
import { spaces } from '../designTokens';
import {connect} from 'react-redux';
import { selectors } from '../PermissionsApp/reducer';
import { addDatasource } from '../urls';
import * as SettingsAPI from '../SettingsContainer/SettingsAPI';
import { browserHistory } from 'react-router';
import {
  SET_MENU_DIALOG_VISIBLE as setMenuDialogVisible,
  SET_SCAN_STATUS as setScanStatus,
  SET_ACCOUNT_SIGN_UP as setAccountSignUp,
} from '../PermissionsApp/actions';

const mapDispatchToProps = {
  setMenuDialogVisible,
  setScanStatus,
  setAccountSignUp
}
const mapStateToProps = state => ({
  getIsMenuDialogVisible: () => selectors.getIsMenuDialogVisible(state),
  getScanStatus: () => selectors.getScanStatus(state)
});
//type THomepageProps = { };
const s = StyleSheet.create({
  homepage: {
    padding: spaces.m,
    position:'absolute',
    margin:'0px auto',
    top:'50%',
    left:'50%',
    transform:'translate(-50%, -50%)',
    fontSize: '20px'
  },
  pageHeader: {
	letterSpacing: '0.5px',
	textAlign: 'center',
	color: '#ca8032',
  },
  installationInfo: {
	letterSpacing: '0.5px',
	textAlign: 'center',
	color: '#8f9196',
	padding: spaces.m,
  }
});


class HomePage extends Component {
  constructor(props) {
    super(props);
    this.googleAuthVerify = this.googleAuthVerify.bind(this);
    this.onGoogleAuthResult = this.onGoogleAuthResult.bind(this);
  }

  // componentWillMount() {
  //   this.props.setScanStatus(true);
  // }

  googleAuthVerify() {
    const auth = this.props.authContent;
    const email = auth.profile.email;
    const authToken = auth.profile.authToken;
    const left = (window.innerWidth / 4);
    const url = addDatasource(email, authToken);

    window.addEventListener('message', this.onGoogleAuthResult);
    this.googleAuthWindow = window.open(
      url,
      'googleWindow',
      'width=600,height=500,status=1,top=70,left=' + left + ''
    );

    var self = this;
    var scanProgressId = setInterval(function() { checkScanProgress(self,email,authToken);},1000);

    function checkScanProgress(self,email,authToken) {
      SettingsAPI.getScanTime(email,authToken).then(response => {
        if (response && ((response[0] === "0000-00-00 00:00:00")||(response[0] === "None"))) {
          if (response[3] > 0 && response[4] === 0)
            document.getElementById("scanText").innerHTML = "Scanning "+response[3]+" folders ...";
          else if (response[3] === 0 && response[4] > 0)
            document.getElementById("scanText").innerHTML = "Scanning "+response[4]+" files ...";
          else if (response[3] > 0 && response[4] > 0) {
              document.getElementById("scanText").innerHTML = "Scanning "+response[3]+" folders and "+response[4]+" files ...";
              if (response[5] > 0) {
                var percentValue = (((response[3]+response[4])/response[5])*100).toFixed(1);
                percentValue = (percentValue%1 < 0.5)? Math.floor(percentValue) : Math.ceil(percentValue);
                document.getElementById("scanPercentage").innerHTML = percentValue + '% complete';
              }
          }
        }
        else if (response && ((response[0] !== "0000-00-00 00:00:00")||(response[0] !== "None"))) {
          clearInterval(scanProgressId);
          document.getElementById("scanPercentage").innerHTML = '';
          document.getElementById("scanText").innerHTML = "Scanning Complete";
          document.getElementById("scanText").style.color = "green";
          self.props.setScanStatus(false);
          self.props.setAccountSignUp(false);
          setTimeout(function(){
            browserHistory.push('/');
          },2000);
        }
      });
    }
  }

  onGoogleAuthResult(message) {
    window.removeEventListener('message', this.onGoogleAuthResult);
    if (message.data === 'success') {
      this.googleAuthWindow.close();
    }
  }

	render() {

    const scanLink = (
      <div className={css(s.installationInfo)}>
         {/* Click <a href="/datasources">here</a> to scan your GSuite account */}
         <p id="scanText">Click <a onClick={()=>this.googleAuthVerify()}>here</a> to connect to your GSuite account</p>
         <p id="scanPercentage"></p>
      </div>
    );

		return (
      <div>
  			<div className={css(s.homepage)}>
    			<h1 className={css(s.pageHeader)}>Welcome to ADYA</h1>
          { scanLink }
      	</div>
      </div>
		);
	}
}
export default connect(mapStateToProps, mapDispatchToProps)(HomePage);
