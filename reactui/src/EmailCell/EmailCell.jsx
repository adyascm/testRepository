import React, { Component } from 'react';
import { StyleSheet, css } from 'aphrodite/no-important';
import { spaces } from '../designTokens';

const s = StyleSheet.create({
  cellLabel: {
    marginLeft: spaces.xs,
    fontStyle: 'normal'
  }
});

class EmailCell extends Component {
  render() {
    let label = this.props.value;
    
    return (
      <span className={css(s.cellLabel)}>
        {label}
      </span>
    );
  }
}

export default EmailCell;
