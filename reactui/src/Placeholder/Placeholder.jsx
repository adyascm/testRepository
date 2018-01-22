// @flow
import React, {Component} from 'react';
import { StyleSheet, css } from 'aphrodite/no-important';
import { spaces } from '../designTokens';

type TPlaceholderProps = { };
const s = StyleSheet.create({
  placeholder: {
    padding: spaces.m,
    margin: 0,
  }
});

class Placeholder extends Component {
  props: TPlaceholderProps;

  render() {
    return (
      <div className={css(s.placeholder)}>
        <h2>This page is coming soon.</h2>
      </div>
    );
  }
}

export default Placeholder;
