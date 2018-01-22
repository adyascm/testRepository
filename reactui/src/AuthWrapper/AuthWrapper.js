import React, { Component } from 'react';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import { authSelectors } from '../AuthContainer';

const mapStateToProps = ({ auth }) => ({ auth });

const mapDispatchToProps = {
  redirectToLoginPage: redirectTo => push(`/auth?redirectTo=${redirectTo}`)
};

const AuthWrapper = ChildComponent => {
  class AuthWrapperInner extends Component {
    componentWillMount() {
      if (!authSelectors.getIsLoggedIn(this.props.auth) && authSelectors.getIsRehydrated(this.props.auth)) {
        this.props.redirectToLoginPage(this.props.location.pathname);
      }
    }

    componentWillReceiveProps(nextProps) {
      if (!authSelectors.getIsLoggedIn(nextProps.auth) && authSelectors.getIsRehydrated(nextProps.auth)) {
       this.props.redirectToLoginPage(this.props.location.pathname);
     }
    }

    render() {
      if (!authSelectors.getIsLoggedIn(this.props.auth) || !authSelectors.getIsRehydrated(this.props.auth)) {
        return null;
      }

      return <ChildComponent {...this.props} />
    }
  }

  return connect(mapStateToProps, mapDispatchToProps)(AuthWrapperInner);
}

export default AuthWrapper;
