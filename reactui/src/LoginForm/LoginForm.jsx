import React, { Component } from 'react';
import { Field, reduxForm } from 'redux-form';
import Button from '../Button';
import * as urls from '../urls.js';
import { push } from 'react-router-redux';
import InputEmail from '../Account/InputEmail';
import { browserHistory } from 'react-router';
import {IS_LOGGIN as setisLogin} from '../AuthContainer/actions';
import {connect} from 'react-redux';
import { selectors } from '../PermissionsApp/reducer';
import {SET_ACCOUNT_SIGN_UP as setAccountSignUp} from '../PermissionsApp/actions';

const mapDispatchToProps = {
  setisLogin,
  setAccountSignUp,
  redirectTo: url => push(url)
}

const mapStateToProps = state => ({
  getAccountSignUp: () => selectors.getAccountSignUp(state)
});

const validate = values => {
  const errors = {};

  if (!values.email) {
    errors.email = 'An email address is required.';
  } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i.test(values.email)) {
    // TODO: how do we do this test without a regex? How do we let the browser do this test?
    errors.email = 'The email address you entered is invalid.';
  }

  if (!values.password) {
    errors.password = 'Please enter a password.';
  }

  return errors;
};

class LoginForm extends Component {
  constructor(props) {
    super(props);
    this.state = {
      formType:'',
      isDialogueVisible: false,
      googleLogin: false,
      email: '',
      authToken: ''
    }
  }
  onEditClick = (e) => {
    if(e === 'forgot_pw') {
      this.setFormType('forgot_pw');
    }
    this.setIsDialogueVisible(true,e);
  }
  setIsDialogueVisible = (e) => {
    this.setState({isDialogueVisible: e})
  }
  setFormType = (e) => {
    this.setState((formType) => ({
      formType: e
    }))
  }

  componentWillReceiveProps(NextProps){
       // window.location.href = "/"
    // this.props.redirectTo(this.props.location.query.redirectTo || '/')
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

  googleLoginFlag = () => {

    const left = (window.innerWidth / 4);
    const url = urls.googleLogin();

    console.log("url : ", url)


    const headers = {
      'Accept': 'application/json'
    }

    window.addEventListener('message', this.onGoogleAuthResult);
    // this.props.setAccountSignUp(true);
    this.googleAuthWindow = window.open(
      url,
      'googleWindow',
      'width=600,height=500,status=1,top=70,left=' + left + '',

    );
  }

  onGoogleAuthResult = (message) => {

      window.removeEventListener('message', this.onGoogleAuthResult);
      if (message.data === 'success') {
        this.googleAuthWindow.close();
      }
        console.log("email from localstorage: ", localStorage.getItem("email"))
        if(localStorage.getItem("email")){
          var profile = {'email':localStorage.getItem("email"), 'authToken':localStorage.getItem("authToken")}
          this.props.setisLogin(true, profile)
          this.props.setAccountSignUp(true)

        }

  }




  render() {

    const { handleSubmit, onSubmit, valid, error } = this.props
    return (
      <div>
      <form className="form-horizontal" onSubmit={handleSubmit(onSubmit)}>
        <div className="form-group">
          <label className="form-label" htmlFor="email">Email</label>
          <Field type="email" name="email" component={this.props.renderFormField} />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="password">Password</label>
          <Field type="password" name="password" component={this.props.renderFormField} />
        </div>
        <div className="form-group">
          {error && this.props.renderError(error)}
        </div>
        <div>
          <Button label="Login"
                  onClick={handleSubmit(onSubmit)}
                  isPrimary={true}
                  disabled={this.props.isLoggingIn || !valid} />
          <Button label="GoogleLogin"
                  onClick={this.googleLoginFlag}
                   />
          <div className="form-group-right">
            <a onClick={() => this.onEditClick('forgot_pw')}>Forgot Password?</a>
          </div>
        </div>
      </form>
      <InputEmail formType={this.getFormType()}
                    isVisible={this.getIsDialogueVisible()}
                    onClose={() => this.modalClose()}

      />
      </div>
    );
  }
}

LoginForm = reduxForm({ form: 'login' , validate })(LoginForm);
export default connect(mapStateToProps,mapDispatchToProps)(LoginForm);
