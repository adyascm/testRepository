import React, { Component } from 'react';
import { StyleSheet, css } from 'aphrodite/no-important';
import { spaces } from '../designTokens';

const s = StyleSheet.create({
  cellLabel: {
    marginLeft: spaces.xxs,
    fontStyle: 'normal'
  }
});

class ReportsCell extends Component {
  render() {
    let label = this.props.value;

    if (label == null)
      label = " -- ";

    return (
      <span className={css(s.cellLabel)}>
        {label}
      </span>
    );
  }
}

export default ReportsCell;
