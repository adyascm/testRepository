import React, { Component } from 'react';
import { StyleSheet, css } from 'aphrodite/no-important';
import { components } from '../designTokens';
import { em } from '../Helpers/styleUnitHelpers';

import SvgSymbol from '../SvgSymbol';

const styles = StyleSheet.create({
  icon: {
    position: 'relative',
    display: 'inline-flex',
    alignSelf: 'center'
  },
  xxs: {
    width: components.icon.size.xxs,
    height: components.icon.size.xxs
  },
  xs: {
    width: components.icon.size.xs,
    height: components.icon.size.xs
  },
  s: {
    width: components.icon.size.s,
    height: components.icon.size.s
  },
  m: {
    width: components.icon.size.m,
    height: components.icon.size.m
  },
  l: {
    width: components.icon.size.l,
    height: components.icon.size.l
  },
  xl: {
    width: components.icon.size.xl,
    height: components.icon.size.xl
  },
  svgIcon_Inline: {
    position: 'absolute',
    bottom: `-${em(1.5)}em`
  }
});

class Icon extends Component {
  static defaultProps = {
    size: 's',
    isInline: false
  }

  render() {
    let iconClassName = css(styles.icon, styles[this.props.size]);

    if (this.props.additionalClassNames) {
      iconClassName = iconClassName + ' ' + this.props.additionalClassNames;
    }

    return (
      <span className={iconClassName} onClick={this.props.onClick}>
        <SvgSymbol name={this.props.name}
                   additionalClassNames={css(
                    styles[this.props.size],
                    this.props.isInline ? styles.svgIcon_Inline : null)}/>
      </span>
    );
  }
}

export default Icon;
