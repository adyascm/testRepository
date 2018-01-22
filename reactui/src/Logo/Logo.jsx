// @flow
import React, {Component} from 'react';
import SvgSymbol from '../SvgSymbol';
import { StyleSheet, css } from 'aphrodite/no-important';
import { colors, spaces, sizes } from '../designTokens';

type TLogoProps = { };

const styles = StyleSheet.create({
  logo: {
    display: 'flex',
    color: colors.primary,
    width: sizes.xs,
    height: sizes.xxxs,
    marginRight: spaces.l,
  }
});

class Logo extends Component {
  props: TLogoProps;

  render() {
    return (
      <div className={css(styles.logo)}>
        <SvgSymbol name="logo"/>
      </div>
    );
  }
}

export default Logo;
