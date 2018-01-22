import React, { Component } from 'react';
import { Field, reduxForm } from 'redux-form';
import Button from '../Button';

const validate = values => {
  const errors = {};

  if (!values.name) {
    errors.name = 'Please enter a name for this account.'
  }

  if (!values.email) {
    errors.email = 'An email address is required.';
  } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i.test(values.email)) {
    // TODO: how do we do this test without a regex? How do we let the browser do this test?
    errors.email = 'The email address you entered is invalid.';
  }

  if (!values.password) {
    errors.password = 'Please enter a password.';
  }

  if (!values.verify_password) {
    errors.verify_password = 'Please re-enter your password.';
  } else if (values.verify_password !== values.password) {
    errors.verify_password = 'The passwords you entered don\'t match.';
  }

  return errors;
};

class SignupForm extends Component {
  render() {
    const { handleSubmit, onSubmit, valid, error } = this.props;

    return (
      <form className="form-horizontal" onSubmit={handleSubmit(onSubmit)}>
        <div className="form-group">
          <label className="form-label" htmlFor="name">Name</label>
          <Field type="text" name="name" component={this.props.renderFormField} />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="email">Email</label>
          <Field type="email" name="email" component={this.props.renderFormField} />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="password">Password</label>
          <Field type="password" name="password" component={this.props.renderFormField} />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="password">Re-enter password</label>
          <Field type="password" name="verify_password" component={this.props.renderFormField} />
        </div>
        <div className="form-group">
          { error && this.props.renderError(error) }
        </div>
        <div>
          <Button label="Sign Up"
                  onClick={handleSubmit(onSubmit)}
                  isPrimary={true}
                  disabled={this.props.isSigningUp || !valid} />
        </div>
      </form>
    );
  }
}

SignupForm = reduxForm({ form: 'signup', validate })(SignupForm);
export default SignupForm;
