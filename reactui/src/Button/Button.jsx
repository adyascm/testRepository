import React, {Component} from 'react';
import { StyleSheet, css } from 'aphrodite/no-important';
import {
  border,
  colors,
  spaces,
  radii,
  typography
} from '../designTokens';
import { rem } from '../lib/styleUnitHelpers';
import { ms } from '../lib/modularScaleHelpers';
import { allCaps } from '../commonStyles';

/* eslint-disable no-script-url */
const jsNoopHref = 'javascript:;';
/* eslint-enable no-script-url */

const buttonHeight = `${rem(typography.lineHeightPx * 1.5)}rem`;
const buttonHeightSmall = `${rem(typography.lineHeightPx * 1.2)}rem`;
const buttonHeightXSmall = `${rem(typography.lineHeightPx * 1.1)}rem`;

const colorDisabled = colors.grey10;

const buttonModifierStyles = {
  color: colors.linkLightHover,
  textDecoration: 'none',
}

const button_PrimaryModifierStyles = {
  color: colors.linkHover,
}

const button_DisabledModifierStyles = {
  color: colorDisabled,
  cursor: 'not-allowed',
}

const styles = StyleSheet.create({
  button: {
    position: 'relative',
    display: 'inline-block',
    padding: `0 ${spaces.xs}`,
    margin: '5px', // For input.btn

    lineHeight: buttonHeight,
    color: colors.linkLight,

    border: `${border.width}px ${border.style}`,
    borderRadius: radii.l,

    textAlign: 'center',
    whiteSpace: 'nowrap',
    verticalAlign: 'middle',
    cursor: 'pointer',
    backgroundImage: 'none',
    userSelect: 'select',
    touchAction: 'manipulation',
    ...allCaps,

    ':hover': {...buttonModifierStyles},
    ':focus': {...buttonModifierStyles},
    ':active': {...buttonModifierStyles},
  },
  m: {},
  s: {
    fontSize: `${ms(-1)}rem`,
    lineHeight: buttonHeightSmall,
  },
  xs: {
    fontSize: `${ms(-2)}rem`,
    lineHeight: buttonHeightXSmall,
  },
  button_Primary: {
    color: colors.link,
    ':hover': {...button_PrimaryModifierStyles},
    ':focus': {...button_PrimaryModifierStyles},
    ':active': {...button_PrimaryModifierStyles},
  },
  button_Disabled: {
    color: colorDisabled,
    ':hover': {...button_DisabledModifierStyles},
    ':focus': {...button_DisabledModifierStyles},
    ':active': {...button_DisabledModifierStyles},
  }
});

class Button extends Component {
  static defaultProps = {
    size: 'm',
    isPrimary: false,
    disabled: false
  }

  render() {
    let clickHandler = () => { return; };

    if (!this.props.disabled) {
      clickHandler = this.props.onClick;
    }

    return (
      <a className={
        css(
          styles.button,
          styles[this.props.size],
          this.props.isPrimary ? styles.button_Primary : null,
          this.props.disabled ? styles.button_Disabled : null
          )}
         onClick={clickHandler}
         href={jsNoopHref}>
        {this.props.label}
      </a>
    );
  }
}

export default Button;
