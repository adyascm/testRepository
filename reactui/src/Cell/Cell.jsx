// @flow
import React, {Component} from 'react';
import { StyleSheet, css } from 'aphrodite/no-important';
import { spaces } from '../designTokens';

type TCellProps = {
  children?: React$Element<any> | React$Element<any>[], // FIXME: make this non-optional when Flow supports JSX children.
  width?: string,
  align: 'left' | 'right' | 'center',
};

const s = StyleSheet.create({
  cell: {
    margin: 0,
    display: 'inline-flex',
    userSelect: 'none',
  },
  cell_fixedWidth: {
    flexGrow: 0,
    flexShrink: 0,
  },
  cellChildren: {
    display: 'inline-flex',
    margin: '0',
    padding: `${spaces.xxs}`,
  },
  center: {
    justifyContent: 'center',
  },
  left: {
    justifyContent: 'flex-start',
  },
  right: {
    justifyContent: 'flex-end',
  },
});

class Cell extends Component {
  props: TCellProps;

  static defaultProps = {
    width: 'auto',
    align: 'left',
  }

  render() {
    let childEls = [];

    const isFixedWidth = this.props.width !== 'auto';

    childEls = React.Children.map(this.props.children, (c, i) => {
      return (
        <span className={css(s.cellChildren)}
              key={`${i}`}>
          {c}
        </span>
      );
    });

    return (
      <div className={css(
              s.cell,
              s[this.props.align],
              isFixedWidth ? s.cell_fixedWidth : null,
            )}
           style={isFixedWidth ? {width: this.props.width} : {}}>
        {childEls}
      </div>
    );
  }
}

export default Cell;
