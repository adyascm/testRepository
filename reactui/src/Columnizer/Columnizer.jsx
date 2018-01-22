import React, {Component} from 'react';
import { StyleSheet, css } from 'aphrodite/no-important';
import { spaces } from '../designTokens';
import { clearfix } from '../commonStyles';

const styles = StyleSheet.create({
  columnizer: {
    ...clearfix,
    overflowX: 'visible',
  },
  columnizer_hasGutter: {
    marginRight: `-${spaces.s}`,
    marginLeft: `-${spaces.s}`,
  },
  columnizer_isFullHeight: {
    height: '112%'
  },
  columnizer_isFullWidth: {
    width: '100%'
  },
  columnizerColumn: {
    margin: 0,
    float: 'left',
  },
  columnizerColumn_floadNone: {
    float:'none',
  },
  columnizerColumn_isFullHeight: {
    height: '108%',
  },
  columnizerColumn_hasGutter: {
    padding: `0 ${spaces.ss}`,
  }
});

class Columnizer extends Component {
  static defaultProps = {
    height: false,
    hasGutter: false
  };
  render() {
    const columnEls = [];
    let columnWidthP = [];
    if (this.props.children && this.props.children.length) {
      const length = this.props.children.length;
      columnWidthP = Array(length).fill((1 / length) * 100);
    }

    if (this.props.children && this.props.widthPercentages && (this.props.widthPercentages.length === this.props.children.length)) {
      columnWidthP = this.props.widthPercentages;
    }

    // We use the index as the key here since we don't expect the indexes to change too often
    // or too much. If they do, I guess we re-render. Welp.
    React.Children.forEach(this.props.children, (c, i) => {
      columnEls.push(
        <div className={css(
          styles.columnizerColumn,
          this.props.isOneBlock ? styles.columnizerColumn_floadNone : null,
          this.props.isFullHeight ? styles.columnizerColumn_isFullHeight : null,
          this.props.hasGutter ? styles.columnizerColumn_hasGutter : null)}
          key={i}
          style={{width: `${columnWidthP[i]}%`}}>
          {c}
        </div>
      );
    });

    return (
      <div className={css(
          styles.columnizer,
          this.props.isFullHeight ? styles.columnizer_isFullHeight : null,
          this.props.isFullWidth ? styles.columnizer_isFullWidth : null,
          this.props.hasGutter ? styles.columnizer_hasGutter : null
          )}>
        {columnEls}
      </div>
    );
  }
}

export default Columnizer;
