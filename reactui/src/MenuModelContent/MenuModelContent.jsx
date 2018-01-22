// @flow
import React, {Component} from 'react';
import { spaces,colors } from '../designTokens';
import MenuModel from '../MenuModel';
import Icon from '../Icon';
import {connect} from 'react-redux';
import { selectors } from '../PermissionsApp/reducer';
import { selectors as authSelectors } from '../AuthContainer/reducer';
import Button from '../Button';
import { LOGOUT } from '../AuthContainer/actions';


import {SET_MENU_DIALOG_VISIBLE as setMenuDialogVisible,deleteAccount} from '../PermissionsApp/actions';

const mapDispatchToProps = {
setMenuDialogVisible,
deleteAccount,
logout:LOGOUT
}
const mapStateToProps = state => ({
getIsMenuDialogVisible: () => selectors.getIsMenuDialogVisible(state),
getmodelData: () => selectors.getmodelData(state),
getProfile: () => authSelectors.getProfile(state.auth),
getIsDeletedAllData: ()=>selectors.getIsDeletedAllData(state)
});

type TPageContentProps = {
children?: React$Element<any>[] // FIXME: make this non-optional when Flow supports JSX children.
};
class MenuModelContent extends Component {
props: TPageContentProps;
constructor(props) {
  super(props);
  this.state = {
    isDisabled : false,
  }

}

  deleteAccountUser = ()=> {
    this.setState({
      isDisabled : true
    });

    this.props.deleteAccount(this.props.getProfile().email, '','',this.props.getProfile().authToken).then(()=> {

      setTimeout(()=> {
        this.setState({
          getIsMenuDialogVisible: this.props.setMenuDialogVisible(false, "manageAccount")
        });

        this.props.logout();

        this.setState({
          isDisabled : false
        });

      }, 1000);

    });

  }
  // componentWillReceiveProps(nextProps) {
  //    this.setState({
  //         getIsDeletedAllData: nextProps.getIsDeletedAllData(false)
  //       });
  // }

render() {
  const profile = this.props.getProfile();
  let content;
  let title;
  let footerContent='';
  if(this.props.getmodelData()==="windows") {
    title = "Windows Agent Installer";
    content = (
      <div>
        <div style={{padding:spaces.m}}>
          Download the windows agent installer from <a href="https://app.adya.io/static/winagent/AdyaService.zip">here</a>
        </div>
        <div style={{padding:spaces.m}}>After installing the agent, enter the following information when running the agent</div>
        <div style={{padding:spaces.m}}>
          <ul className="default-ul">
            <li>Name : Any unique name for that Data Source (example: Los Angeles)</li>
            <li>Account : {profile.email}</li>
            <li>Watch Directory : The local directory monitored by Adya</li>
            <li>Active Directory(optional)</li>
            <li>Domain User :</li>
            <li>Domain Password :</li>
          </ul>
        </div>
      </div>
    );
  } else if(this.props.getmodelData()==="manageAccount") {
      title = "";
      footerContent = (this.props.getIsDeletedAllData() ? ''
        :
        <div style={{textAlign:'center'}}>
          <span style={{display:'inline-block',margin:10,}} >
            <Button isPrimary={true} disabled={this.state.isDisabled} size='s' label="Confirm Deletion" key="1" onClick={this.deleteAccountUser.bind(this)} />
          </span>
          <span style={{display:'inline-block',margin:10,}}>
            <Button size='s' label="Cancel" key="2" onClick={()=>this.props.setMenuDialogVisible(false, "manageAccount")} />
          </span>
        </div>
      );
      content = (
        <div style={{textAlign:'center',color:colors.text}}>
          {this.props.getIsDeletedAllData() ? (<div style={{marginBottom:30}}>Your account has been deleted successfully.</div>) : "Are you sure you want to delete the account Adya and all data?"}
        </div>

      );

  }
   else {
    title = "manage Datasource";
    content = (
      <div>
        <p>manage datasource</p>
      </div>
    );
  }
  return (
      <MenuModel
        title={title}
        closeTextIcon={<Icon name="x" size="s" />}
        isVisible={this.props.getIsMenuDialogVisible()}
        bodyContent={this.props.getmodelData() ? content :''}
        handleClose={() => this.props.setMenuDialogVisible(false, "windows")}
        menuModelFooter={footerContent}
        deleteAccountUser={this.deleteAccountUser}

      />
  );
}
}

export default connect(mapStateToProps, mapDispatchToProps)(MenuModelContent);
