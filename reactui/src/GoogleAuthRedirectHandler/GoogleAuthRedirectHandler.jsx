import React, { Component } from 'react';
import { StyleSheet, css } from 'aphrodite/no-important';
import Button from '../Button';
import { colors, sizes, spaces } from '../designTokens';

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
      window.opener.postMessage(this.props.params.status, '*');
    }
  }

  render() {
    let messageElt;
    if (this.props.params.status === 'success') {
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

export default GoogleAuthRedirectHandler;
