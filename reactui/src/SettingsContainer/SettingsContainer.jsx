import React, { Component } from 'react';
import PageContent from '../PageContent';
import Pane from '../Pane';
import PaneToolbar from '../PaneToolbar';
import * as SettingsAPI from './SettingsAPI';
import { addDatasource } from '../urls';
import { selectors } from '../PermissionsApp/reducer';
import { selectors as authSelectors } from '../AuthContainer/reducer';
import {connect} from 'react-redux';
import UsersourceEditor from '../UsersourceEditor';
//import UserDataSourceModal from '../UsersourceEditor/UserDataSourceModal';

import {
  SET_MENU_DIALOG_VISIBLE as setMenuDialogVisible,
  deleteAccount,
  SET_SCAN_STATUS as setScanStatus,
  SET_WIDGET_REPORT as setWidgetReport
} from '../PermissionsApp/actions';

const mapDispatchToProps = {
  setMenuDialogVisible,
  deleteAccount,
  setScanStatus,
  setWidgetReport
}

const mapStateToProps = state => ({
  getIsMenuDialogVisible: () => selectors.getIsMenuDialogVisible(state),
  getProfile: () => authSelectors.getProfile(state.auth),
  getTopLevelResources: (email) => selectors.getTopLevelResources(state, email),
  getScanStatus: () => selectors.getScanStatus(state),
  getWidgetReport: () => selectors.getWidgetReport(state)
});


class SettingsContainer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      userSources: [],
      dataSources: [],
      userDatasources: [],
      query: '',
      isDialogueVisible:true
    }
    this.onGoogleAuthResult = this.onGoogleAuthResult.bind(this);
    this.getAllUserDataSources = this.getAllUserDataSources.bind(this);
  }

  componentWillMount() {
    if(this.props.getWidgetReport() === true)
      this.props.setWidgetReport(false);
  }

  handleMenuModel(modelData) {
    this.props.setMenuDialogVisible(true, modelData);
  }

  handleGoogleAuth() {
    console.log("googledrive")
    const left = (window.innerWidth / 4);
    const auth = this.props.auth
    const authToken = auth.profile.authToken
    const email = auth.profile.email

    const url = addDatasource(email, authToken);
    var params = [
      'height='+screen.height,
      'width='+screen.width,
      'fullscreen=yes' // only works in IE, but here for completeness
    ].join(',');

    //Google auth Screen on small window:
    //'width=600,height=500,status=1,top=70,left=' + left + ''

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
        console.log("Drive Scan response: ", response);
        if (response && response[0] !== "None") {
          clearInterval(scanProgressId);
          self.props.setScanStatus(false);
          window.location.reload();
        }
        else if (response && response[0] === "None") {
          self.props.setScanStatus(true);
        }
      });
    }
    //setTimeout(function() { this.props.setScanStatus(false); }.bind(this), 10000);
  }

  onGoogleAuthResult(message) {
    console.log("Message params: ", this.props.params);
    window.removeEventListener('message', this.onGoogleAuthResult);
    if (message.data === 'success') {
      this.googleAuthWindow.close();
    }
  }

  buttonclick = () => {

  }
  getIsDialogueVisible = () => {

    return this.state.isDialogueVisible
  }

  componentDidMount() {

    const auth = this.props.auth
    const authToken = auth.profile.authToken
    const email = auth.profile.email

    //console.log("Did Mount");
    SettingsAPI.getUserDatasources(email,authToken).then((userDatasources) => {
      console.log(userDatasources);
      this.setState({userDatasources})
    })
  }

  getAllUserDataSources() {
    const auth = this.props.auth
    const authToken = auth.profile.authToken
    const email = auth.profile.email

    //console.log("Did Mount");
    SettingsAPI.getUserDatasources(email,authToken).then((userDatasources) => {
      console.log(userDatasources);
      this.setState({userDatasources})
    })
  }



  render() {
    console.log(this.state.userDatasources);
    //console.log("Scan status is : ", this.props.getScanStatus());

    const { userDatasources } = this.state
    const addDatasource =
     <div className="dropdown">
       <div className="dropbtn_name">Add Datasource</div>
       <div className="dropdown-content_menu">
         <a onClick={()=>this.handleMenuModel('windows')}>Windows</a>
         <a id="GDriveButton" onClick={()=>this.handleGoogleAuth()}>Google Drive</a>
       </div>
     </div>

    // const deleteButton = <Button isPrimary={true} size='s' label="Delete Account" onClick={()=>this.handleMenuModel('manageAccount')}/>
    const toolbar = <PaneToolbar isActive={true} leftCol={[<h4>Manage Datasource</h4>]} rightCol={[addDatasource]} />;

    const usersourceEditors = userDatasources.map(
      (uds, index) =>
      <UsersourceEditor usersource={uds}
                        key={index}
                        auth={this.props.auth}
                        getAllUserDataSources={this.getAllUserDataSources}
      />);

    return (
      <PageContent isOneBlock={true}>
        <Pane isFullHeight={true} showScrollbar={true} toolbar={toolbar}>
          <div className='list-reports'>

       { usersourceEditors }

         </div>
        </Pane>
      </PageContent>
    );
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(SettingsContainer);
