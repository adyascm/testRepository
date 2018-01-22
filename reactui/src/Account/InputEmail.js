import React, { Component } from 'react';
import Modal from '../Modal';
import {SET_MENU_DIALOG_VISIBLE as setMenuDialogVisible,deleteAccount,
        SET_FORGOT_PASSWORD_EMAIL as setForgotPasswordEmail } from '../PermissionsApp/actions';
import { selectors } from '../PermissionsApp/reducer';
import { selectors as authSelectors } from '../AuthContainer/reducer';
import { LOGOUT } from '../AuthContainer/actions';
import {connect} from 'react-redux';
import {colors} from '../designTokens';
import serializeForm from 'form-serialize';
import * as ForgotPasswordAPI from './ForgotPasswordAPI';
import ResetPassword from './ResetPassword';



const mapDispatchToProps = {
  setMenuDialogVisible,
  deleteAccount,
  setForgotPasswordEmail,
  logout:LOGOUT
}

const mapStateToProps = state => ({
  getIsMenuDialogVisible: () => selectors.getIsMenuDialogVisible(state),
  getmodelData: () => selectors.getmodelData(state),
  getProfile: () => authSelectors.getProfile(state.auth),
  getIsDeletedAllData: ()=>selectors.getIsDeletedAllData(state),
  getForgotPasswordEmail: ()=>selectors.getForgotPasswordEmail(state),
  auth: ({ auth }) => ({ auth })
});

class InputEmail extends Component {

    constructor() {
      super();
      this.state = {
        value: '',
        forgot_pw_email_response:[],
        forgot_pw_flag: null,
        forgot_pw_email: ''
      };

      this.submit = this.submit.bind(this);
      this.handleChange = this.handleChange.bind(this);
    }

    closer = (props) => {
       this.setState({
            forgot_pw_flag:null,
          })
    //this.props.setIsDialogueVisible(false)
    console.log("closer", props);

    props.onClose();
  }

  handleChange(event) {
    console.log(event.target.value);
      this.setState({value: event.target.value});   
  }

  submit(event) {
    event.preventDefault();
    const getEmailVal = serializeForm(event.target, {hash: true})
    let authtoken = '';
   if(this.props.formType === 'manageAccount') {
      if(this.props.getProfile().email === this.state.value) {
        this.handleMenuModel('manageAccount')
      }
      else {
        alert("Please enter the correct email id");
      }
    }
    else if(this.props.formType === 'forgot_pw') {
      console.log(getEmailVal)
      ForgotPasswordAPI.sendEmail(getEmailVal).then(response => {
        if(response != null) {
          console.log(response);
          authtoken = response[5];
          this.setState({
            forgot_pw_flag:true,
            forgot_pw_email_response: response,
            forgot_pw_email:getEmailVal.email,
          })
            return <ResetPassword authtoken={response[5]} forgot_pw_email={this.state.forgot_pw_email}/>
          this.props.setForgotPasswordEmail(getEmailVal.email);
          console.log("received email : ", this.props.getForgotPasswordEmail());
        }
        else {
          this.setState({
            forgot_pw_flag:false,
          })
        }
      })
    }
  }
  handleMenuModel(modelData) {
    console.log(modelData)
    this.props.setMenuDialogVisible(true, modelData);
  }

  render() {
    const { forgot_pw_flag, forgot_pw_email_response,forgot_pw_email } = this.state;
    console.log(forgot_pw_email);
    const divStyle = {
      float:'right',
      paddingRight: '16px',
      margin:'20px',
    };

    let modalContent;
      if(this.props.formType === 'manageAccount') {
        modalContent = (
          <div className="create-form_manageAccount" style={{color:colors.text}}>
            <form onSubmit={this.submit}>
              <label>Please provide the registered email id.</label>
              <input className="manageAccount_email_input" type="email" ref="input_value" required name="email"
                     placeholder="please enter your email id" onChange={this.handleChange}/>
              <div style={divStyle}>
                         {/*    <Button isPrimary={true} size='m' label="Submit" onSubmit={() => this.submit()} />*/}
                <input type="submit" value="submit"/>
              </div>
            </form>
          </div>
        )
      }
      else if(this.props.formType === 'forgot_pw') {
          if(forgot_pw_flag === null)
          {
            modalContent= (
              <div className="create-form_manageAccount" style={{color:colors.text}}>
                <form onSubmit={this.submit}>
                  <label>Please provide the registered email id.</label>
                  <input className="manageAccount_email_input" type="email" ref="input_value" required name="email"
                         placeholder="please enter your email id" onChange={this.handleChange}/>
                  <div style={divStyle}>
                             {/*    <Button isPrimary={true} size='m' label="Submit" onSubmit={() => this.submit()} />*/}
                    <input type="submit" value="submit"/>
                  </div>
                </form>
              </div>
            )
          }
        else if(forgot_pw_flag === true)
        {

            modalContent = (
              <div className="create-form_manageAccount" style={{color:colors.text}}>
                <form>
                  <label>Please follow the instruction sent to <i>{forgot_pw_email}</i> to reset your password.</label>         
                </form>
              </div>
            )
        }
        else{
            modalContent = (
              <div className="create-form_manageAccount" style={{color:colors.text}}>
                <form>
                  <label>No email id is registered under this email.</label> 
                </form>
              </div>
            )
        }
          }
        // }
          
        // }
       // }}
    return(
      <div>
        <Modal  isVisible={this.props.isVisible}
                hideTitle={true}
                isExpanded={false}
                formtype={this.props.formType}
                onClose={() => this.closer(this.props) }>{modalContent}
        </Modal>
      </div>
    )
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(InputEmail);
