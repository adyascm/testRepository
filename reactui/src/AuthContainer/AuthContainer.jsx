import React, { Component } from 'react';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import { StyleSheet, css } from 'aphrodite/no-important';
import { SubmissionError } from 'redux-form';
import LoginForm from '../LoginForm';
import SignupForm from '../SignupForm';
import TabSwitcher from '../TabSwitcher';
import { loginWorkflow, signupWorkflow } from './actions';
import { selectors } from './reducer';
import { colors, sizes, spaces } from '../designTokens';
import { SET_SCAN_STATUS as setScanStatus,
         SET_ACCOUNT_SIGN_UP as setAccountSignUp } from '../PermissionsApp/actions';

const TAB_LOGIN = 'TAB_LOGIN';
const TAB_SIGNUP = 'TAB_SIGNUP';
const ERROR_UKNOWN = 'An unknown server error occurred.';

const styles = StyleSheet.create({
  authContainer: {
    width: sizes.xl,
    padding: spaces.m,
    backgroundColor: colors.blackPearl,
    marginLeft: 'auto',
    marginRight: 'auto',
    marginTop:spaces.m,
    //backgroundColor: 'white'
  },
  error: {
    color: colors.error,
    marginTop:spaces.xs,
    display:'block',
    left:0,
  }
});

const renderError = error => (
  <span className={css(styles.error)}>{error}</span>
);

const renderFormField = ({ input, label, type, meta: { touched, error, warning } }) => (
  <div>
    <label>{label}</label>
    <div>
      <input {...input} placeholder={label} type={type} />
      {touched && (error && renderError(error))}
    </div>
  </div>
);

const mapStateToProps = ({ auth }) => ({
  getIsLoggingIn: () => selectors.getIsLoggingIn(auth),
  getIsSigningUp: () => selectors.getIsSigningUp(auth)
});

const mapDispatchToProps = {
  loginWorkflow,
  signupWorkflow,
  setScanStatus,
  setAccountSignUp,
  redirectTo: url => push(url)
};

class AuthContainer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      activeTab: TAB_LOGIN
    };
  }

  // componentWillMount() {
  //   this.props.setScanStatus(true);
  // }

  onLoginSubmit = values => {
    return this.props.loginWorkflow(values.email, values.password)
      .then(() => {this.props.redirectTo(this.props.location.query.redirectTo || '/')})
      .catch(error => {
        throw new SubmissionError({ _error: error.message || ERROR_UKNOWN });
      });
  };

  onSignupSubmit = values => {
    return this.props.signupWorkflow({
      name: values.name,
      email: values.email,
      password: values.password
    })
      .then(() => {
        console.log("signup props : ", this.props);
        this.props.setScanStatus(true);
        this.props.setAccountSignUp(true);
        this.props.redirectTo(this.props.location.query.redirectTo || '/')
        })
      .catch(error => {
        throw new SubmissionError({ _error: error.message || ERROR_UKNOWN });
      });
  };

  setActiveTab = tab => {
    this.setState({ activeTab: tab });
  };

  render() {
    const loginForm = (
      <LoginForm onSubmit={this.onLoginSubmit}
                 isLoggingIn={this.props.getIsLoggingIn()}
                 renderFormField={renderFormField}
                 renderError={renderError} />
    );

    const signupForm = (
      <SignupForm onSubmit={this.onSignupSubmit}
                  isSigningUp={this.props.getIsSigningUp()}
                  renderFormField={renderFormField}
                  renderError={renderError} />
    );

    const tabs = [{
      id: TAB_LOGIN,
      label: 'Login',
      component: loginForm,
      type:"auth"
    }, {
      id: TAB_SIGNUP,
      label: 'Signup',
      component: signupForm,
      type:"auth"
    }];

    return (
      <div className={css(styles.authContainer)}>
        <TabSwitcher tabs={tabs} />
      </div>
    );
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(AuthContainer);
