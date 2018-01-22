import React, { Component } from 'react';
import { StyleSheet, css } from 'aphrodite/no-important';
import {
  border,
  colors,
  radii,
  spaces,
  typography
} from '../designTokens';
import { ms } from '../Helpers/modularScaleHelpers';
import { allCaps, smoothScrollOnTouch } from '../commonStyles';

const commonStyles = {
  margin: 0
}

const headerToolbarCommonStyles = {
  padding: `${spaces.s}`,
  flex: `0 0 auto`
}

const styles = StyleSheet.create({
  pane: {
    display: 'flex',
    flexDirection: 'column',
    // border: `${border.width}px ${border.style} ${colors.backgroundDark}`,
    borderRadius: radii.m,
    backgroundColor: colors.backgroundDark
  },
  pane_isFullHeight: {
    height: '100%'
  },
  scroll: {
    overflowY: 'scroll'
  },
  header: {
    ...headerToolbarCommonStyles
  },
  title: {
    ...commonStyles,
    ...allCaps,
    fontSize: `${ms(2)}rem`,
    lineHeight: typography.lineHeightLarge,
    color: colors.textLight,
    paddingBottom: spaces.s,
  },
  toolbar: {
    ...commonStyles,
    ...headerToolbarCommonStyles,
    display: 'flex',
    // height: sizes.xs,
    paddingTop: spaces.xs,
    paddingBottom: spaces.xs,
    // borderTop: `${border.base}`
  },
  contentWrapper: {
    ...commonStyles,
    ...smoothScrollOnTouch,
    overflow: 'auto',
    borderTop: `${border.base}`,
    height: '100%',
  }
});

class Pane extends Component {
  props: TPaneProps;

  static defaultProps = {
    isFullHeight: false
  }

  render() {
    return (
      <div className={css(
        styles.pane,
        this.props.isFullHeight ? styles.pane_isFullHeight : null
        )}>
        {this.props.title ? (
          <div className={css(styles.header)}>
            <h2 className={css(styles.title)}>{this.props.title}</h2>
          </div>
          ) : null }
        <div className={css(styles.toolbar)}>{this.props.toolbar}</div>
        <div className={css(
          styles.contentWrapper,
          this.props.showScrollbar ? styles.scroll : null
        )}>
          {this.props.children}
        </div>
      </div>
    );
  }
}

export default Pane;
