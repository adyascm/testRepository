import React, { Component } from 'react';
import PageContent from '../PageContent';
import Pane from '../Pane';
import PaneToolbar from '../PaneToolbar';
import Button from '../Button';
import LoaderBox from '../LoaderBox';
// import * as ScheduleReportsAPI from '../Report/utils/ScheduleReportsAPI';
import {SET_MENU_DIALOG_VISIBLE as setMenuDialogVisible,
        deleteAccount,
        SET_WIDGET_REPORT as setWidgetReport
      } from '../PermissionsApp/actions';
import { selectors } from '../PermissionsApp/reducer';
import { selectors as authSelectors } from '../AuthContainer/reducer';
import { LOGOUT } from '../AuthContainer/actions';
//import MenuModel from '../MenuModel';
import {connect} from 'react-redux';
import InputEmail from './InputEmail';
import { colors, spaces, components } from '../designTokens';
import { StyleSheet, css } from 'aphrodite/no-important';
import { googleAuthurl,serviceaccounturl,enhanceAccessDocurl } from '../urls';

// const styles = StyleSheet.create({
//       page: {
//         //display: 'flex',
//         padding: `0 ${spaces.m}`,
//         fontSize: ``
//         //justifyContent: 'space-between',
//       }
//   });
const mapDispatchToProps = {
  setMenuDialogVisible,
  deleteAccount,
  setWidgetReport,
  logout:LOGOUT
}

const mapStateToProps = state => ({
getIsMenuDialogVisible: () => selectors.getIsMenuDialogVisible(state),
getmodelData: () => selectors.getmodelData(state),
getProfile: () => authSelectors.getProfile(state.auth),
getIsDeletedAllData: ()=>selectors.getIsDeletedAllData(state),
getWidgetReport: () => selectors.getWidgetReport(state)
});

class Account extends Component {
  constructor(props) {
    super(props);
    this.state = {
      formType:'',
      isDialogueVisible: false,
      isLoading :false,
      serviceaccountstatus :undefined,
    }
    this.createServiceAccount = this.createServiceAccount.bind(this);
  }

  componentWillMount() {
    if (this.props.getWidgetReport() === true)
      this.props.setWidgetReport(false);
  }

  handleMenuModel(modelData) {
    console.log("modelData")
    this.props.setMenuDialogVisible(true, modelData);
  }

  onEditClick = (e) => {
    console.log(e);
    if(e === 'manageAccount') {
      this.setFormType('manageAccount');
    }
    this.setIsDialogueVisible(true,e);
  }

  createServiceAccount() {
    const auth = this.props.auth
    const authToken = auth.profile.authToken
    const email = auth.profile.email
    const url = serviceaccounturl(email, authToken);
    this.setState({isLoading:true})
    let message;
    fetch(url).then(response =>response.json()).then(
       responsemessage => {
      if (responsemessage ==="success") {
        this.setState({serviceaccountstatus:1});
      }
      else {
        this.setState({serviceaccountstatus:0});
      }
      this.setState({isLoading:false})
    })
    .catch(e => {
      this.setState({serviceaccountstatus:0});
      this.setState({isLoading:false})
    });
  }

    onGoogleAuthResult(message) {
      window.removeEventListener('message', this.onGoogleAuthResult);

      if (message.data === 'success') {
        this.googleAuthWindow.close();
      }
  }

  setFormType = (e) => {
    console.log("inside account setFormType", e);
    this.setState((formType) => ({
      formType: e
    }))
  }

  getFormType = () =>{
    console.log(this.state.formType)
    return this.state.formType
  }

  setIsDialogueVisible = (e) => {
    this.setState({isDialogueVisible: e})
  }

  getIsDialogueVisible = () => {
    return this.state.isDialogueVisible
  }

  modalClose = () => {
    this.setIsDialogueVisible(false);
  }

  render() {
    // const createButton = <Button isPrimary={true} size='s' label="Delete Account"
    //        onClick={() => this.onEditClick('')}/>
    console.log("auth ",this.props.auth)
    const divStyle ={
      paddingRight:"32px"
    }

    const leftbutton = {
      marginLeft: '20px',
      display: 'inline-block'
    };

    const rightbutton = {
      float: 'right',
      display: 'inline-block'
    };

    const loaderstyle = {
      float: 'middle',
      display: 'inline-block'
    };
    const linkstyle = {
      float: 'middle',
      marginLeft:'27px',
      textDecoration:'none'
    };
    const span_style = {
      span: {
        fontSize: '14px',
        paddingLeft: '12px',
        fontFamily: 'sans-serif',
        letterSpacing: '0px',
      }
    }
    //console.log(this.props.submit);
    let messagediv;
    if(this.state.serviceaccountstatus !== undefined){
      let messagedivstyle
      if(this.state.serviceaccountstatus ===1)
      {
        messagedivstyle = {
          color : 'green'
        }
      }else{
        messagedivstyle ={
          color: 'red'
        }
      }
      let message = this.state.serviceaccountstatus ?"Enhanced Access enabled"
                                                    :"Enabling Enhanced Access failed";
      messagediv = <div style={messagedivstyle}>{message}</div>
    }
    const toolbar = <PaneToolbar isActive={true} leftCol={[<h3>Manage Account</h3>]} />;
    let loader
    if (this.state.isLoading) {
      loader =<div style={loaderstyle}> <LoaderBox isFullHeight={true} size='xs'/></div>;
    }

    return(
      <div>
        <PageContent isOneBlock={true} >
          <Pane isFullHeight={true} toolbar={toolbar}>
           <div className="manage_account">
              <div className="account_details_wrapper">
                <div>
                  <div className="border" style={{color:colors.grey8}}>Account Name: <span style={span_style.span}>{this.props.getProfile().accountName}</span></div>
                </div>
                <div className="account_info" style={{color:colors.grey8}}>
                  <div>Email: <span style={span_style.span}>{this.props.getProfile().email}</span></div>
                  <div>Account Type: <span style={span_style.span}>{this.props.getProfile().accountType}</span></div>
                  <div>Account Status: <span style={span_style.span}>{this.props.getProfile().accountStatus}</span></div>
                  <div>Account Id: <span style={span_style.span}>{this.props.getProfile().accountId}</span></div>
                </div>
              </div>
              <div style={divStyle}>
                <div>
                  <a style={linkstyle} href={enhanceAccessDocurl} target="_blank">Read this first to enable</a>
                </div>
                <div style={leftbutton}>
                <Button  isPrimary={true} size='m'
                  label="Enhanced access" onClick={() => this.createServiceAccount()} />
                {messagediv}
                </div>
                {loader}
                <div style={rightbutton}>
                <Button isPrimary={true} size='m'
                  label="Delete Account" onClick={() => this.onEditClick('manageAccount')} />
                </div>
              </div>
            </div>
          {/*onClick= {()=>this.handleMenuModel('manageAccount')}*/}
          </Pane>
          </PageContent>
          <InputEmail formType={this.getFormType()}
                       isVisible={this.getIsDialogueVisible()}
                       onClose={() => this.modalClose()}

          />
      </div>
    );
  }
}
export default connect(mapStateToProps, mapDispatchToProps)(Account);
