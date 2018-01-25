import React, { Component } from 'react';
import { StyleSheet, css } from 'aphrodite/no-important';
import Button from '../Button';
import {connect} from 'react-redux';
import { selectors } from '../AuthContainer/reducer';
import { colors, sizes, spaces } from '../designTokens';
import {SET_GOOGLELOGININFO as setLoginInfo } from '../AuthContainer/actions';


const mapStateToProps = (state) => ({
  getGoogleLoginInfo: () => selectors.getGoogleLoginInfo(state)
});

const mapDispatchToProps = {
  setLoginInfo
}

const styles = StyleSheet.create({
  messageContainer: {
    width: sizes.xl,
    padding: spaces.m,
    backgroundColor: colors.blackPearl,
    marginLeft: 'auto',
    marginRight: 'auto',
    marginTop:spaces.xl,
  }
});

class GoogleAuthRedirectHandler extends Component {
  componentDidMount() {
    if (window.opener) {
      console.log("....this.props. : ", this.props.location.query)
      var authToken = this.props.location.query.authtoken
      var email = this.props.location.query.email
      var profile = {'email':email, 'authToken':authToken}
      this.props.setLoginInfo(profile)
      window.opener.postMessage(this.props.params.status, '*');
    }
  }

  render() {
    let messageElt;
    if (this.props.params.status === 'AccountExist') {
      messageElt = <p>Successfully added data source.</p>;
    } else {
      messageElt = (
        <div>
          <p>There was an error adding your data source.</p>
          <Button size="s" label="Close" isPrimary={true} onClick={() => window.close()} />
        </div>
      );
    }

    return <div className={css(styles.messageContainer)}>{messageElt}</div>;
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(GoogleAuthRedirectHandler);
