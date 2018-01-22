import React, {Component} from 'react';
import Columnizer from '../Columnizer';
import { StyleSheet, css } from 'aphrodite/no-important';
import { opacities, spaces } from '../designTokens';

const styles = StyleSheet.create({
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  toolbar_Inactive: {
    opacity: opacities.high,
  },
  col: {
    display: 'flex'
  },
  col_Right: {
    justifyContent: 'flex-end'
  },
  colElements: {
    fontSize: '13px',
    margin: `0 0 0 ${spaces.s}`,
    ':first-child': {
      marginLeft: 0
    },
    cursor: 'pointer',
    color: '#8f9196'
  }
});

class PaneToolbar extends Component {
  static defaultProps = {
    isActive: false
  }

  render() {
    let leftColEls = [];

    if (this.props.leftCol) {
      this.props.leftCol.forEach((e, i) => {
        leftColEls.push(
          <span className={css(styles.colElements)} key={`${i}`}>{e}</span>
        );
      });
    }

    let rightColEls = [];
    if (this.props.rightCol) {
      this.props.rightCol.forEach((e, i) => {
        rightColEls.push(
          <span className={css(styles.colElements)} key={`${i}`}>{e}</span>
        );
      });
    }

    return (
      <div className={css(styles.toolbar, !this.props.isActive ? styles.toolbar_Inactive : null)}>
        <Columnizer isFullWidth={true}>
          {this.props.leftCol ? (
              <div className={css(styles.col)}>
                {leftColEls}
              </div>
            ) : null}

          {this.props.rightCol ? (
              <div className={css(styles.col, styles.col_Right)}>
                {rightColEls}

              </div>
            ) : null}
        </Columnizer>
      </div>
    );
  }
}

export default PaneToolbar;
