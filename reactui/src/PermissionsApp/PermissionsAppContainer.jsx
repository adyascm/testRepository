import React, { Component } from 'react';
import { connect } from 'react-redux';
import { StyleSheet, css } from 'aphrodite/no-important';
import { sizes } from '../designTokens';
import { authSelectors } from '../AuthContainer';
//import { selectors as authSelectors } from '../AuthContainer/reducer';
import { LOGOUT } from '../AuthContainer/actions';
import PageHeader from '../PageHeader';
import { selectors } from './reducer';
import { SET_SCAN_STATUS as setScanStatus } from './actions';

const styles = StyleSheet.create({
  container: {
    minWidth: sizes.xxxl
  }
});

const mapStateToProps = ({auth}) => ({
  isLoggedIn: authSelectors.getIsLoggedIn(auth),
  profile: authSelectors.getProfile(auth)
});

const mapDispatchToProps = {
  logout: LOGOUT,
  setScanStatus
};

class PermissionsAppContainer extends Component {
  render() {
    // if (!this.props.isLoggedIn) {
    //   console.log("Not logged in");
    //   this.props.setScanStatus(true);
    // }

    return (
      <div className={css(styles.container)}>
        <PageHeader isLoggedIn={this.props.isLoggedIn} profile={this.props.profile}
         logout={this.props.logout} />
        {this.props.children}
      </div>
    );
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(PermissionsAppContainer);
