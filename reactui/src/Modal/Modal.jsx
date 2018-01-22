// @flow
import React, {Component} from 'react';
import { StyleSheet, css } from 'aphrodite/no-important';
import { ms } from '../lib/modularScaleHelpers';
import {
  border,
  colors,
  components,
  opacities,
  radii,
  sizes,
  spaces,
  typography,
  zIndexes,
} from '../designTokens';
import { allCaps } from '../commonStyles';
import Color from 'color';

import Icon from '../Icon';


/* eslint-disable no-script-url */
const jsNoopHref = 'javascript:;';
/* eslint-enable no-script-url */

type TModalProps = {
  title?: string,
  children?: React$Element<any>, // FIXME: make this non-optional when Flow supports JSX children.
  isExpanded?: bool,
  onClose?: (string) => void,
};

const backgroundColor = Color(colors.background).fade(opacities.low).toString();

const commonStyles = {
  margin: 0
};

const headerFooterCommonStyles = {
  display: 'flex',
  minHeight: sizes.xxs,
  padding: spaces.m,
  flexGrow: 0,
  flexShrink: 0,
}

const s = StyleSheet.create({
  modal: {
    ...commonStyles,
    position: 'absolute',
    zIndex: zIndexes.modal,
    display: 'flex',
    top: components.pageHeader.height,
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Color(colors.backgroundLight).fade(opacities.low).toString(),
    backdropFilter: 'blur(4px)',

  },
  modalForgot_pw: {
    ...commonStyles,
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    backgroundColor: backgroundColor,
    border: `${border.width}px ${border.style} ${backgroundColor}`,
    borderRadius: radii.m,
    maxHeight: '90%',
    marginBottom:'11%',
  },
  modalInner: {
    ...commonStyles,
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    backgroundColor: backgroundColor,
    border: `${border.width}px ${border.style} ${backgroundColor}`,
    borderRadius: radii.m,
    maxHeight: '90%',
  },
  modalInner_isExpanded: {
    width: `calc(100% - ${spaces.xl})`,
    height: `calc(100% - ${spaces.xl})`,
    maxHeight: '100%'
  },
  modalInner_filter_isExpanded: {
    width: `calc(100% - ${spaces.xxl})`,
    height: `calc(100% - ${spaces.xxl})`,
    maxHeight: '100%'
  },
  modalContent: {
    ...commonStyles,
    backgroundColor: colors.backgroundDark,
    minHeight: sizes.s,
    minWidth: sizes.xl,
    flexBasis: '100%',
    overflow: 'hidden',
  },
  modalTitle: {
    ...allCaps,
    fontSize: `${ms(1)}rem`,
    lineHeight: typography.lineHeightLarge,
    color: colors.textLight,
    paddingRight: spaces.m,
  },
  modalHeader: {
      backgroundColor: colors.backgroundDark,
    ...commonStyles,
    ...headerFooterCommonStyles,
  },
  modalFooter: {
    ...commonStyles,
    ...headerFooterCommonStyles,
  },
  modalCloseTrigger: {
    position: 'absolute',
    top: spaces.m,
    right: spaces.m,
    margin: 0,
  }
});

class Modal extends Component {
  props: TModalProps;

  static defaultProps = {
    isExpanded: false,
    isVisible: false
  }

  render() {
    console.log("this.props.formtype", this.props.formtype)
    if (!this.props.isVisible) {
      return null;
    }

    let showTitle = !this.props.hideTitle

    return (
      <div className={css(s.modal)}>
        <div className={(this.props.formtype ==='forgot_pw')? css(s.modalForgot_pw): css(
          s.modalInner,
          this.props.isExpanded && this.props.filterclick? s.modalInner_filter_isExpanded
          : this.props.isExpanded? s.modalInner_isExpanded :null
        )}>
          {showTitle &&
            <div className={css(s.modalHeader)}>
              <h2 className={css(s.modalTitle)}>{this.props.title}</h2>
            </div>
          }
          <a className={css(s.modalCloseTrigger)}
             href={jsNoopHref}
             onClick={this.props.onClose}>
            <Icon name="x"/>
          </a>
          <div className={css(s.modalContent)}>
            {this.props.children}
          </div>
          {this.props.footerContent ? (<div className={css(s.modalFooter)}>
            {this.props.footerContent}
          </div>) : null}
        </div>
      </div>
    );
  }
}

export default Modal;
