import React, { Component } from 'react';
import { Field, reduxForm } from 'redux-form';
import Button from '../Button';
import InputEmail from '../Account/InputEmail';

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
export default LoginForm;
