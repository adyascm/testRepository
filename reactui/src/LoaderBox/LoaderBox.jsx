// @flow
import React, {Component} from 'react';
import { StyleSheet, css } from 'aphrodite/no-important';
import { spaces } from '../designTokens';
import Loader from '../Loader';

type TLoaderBoxProps = {
  isFullHeight?: bool,
  size?: 'm'| 's' | 'xs' | 'xxs' | 'l',
};

const styles = StyleSheet.create({
  box: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spaces.m,
  },
  box_isFullHeight: {
    height: '100%',
  }
});

class LoaderBox extends Component {
  props: TLoaderBoxProps;

  static defaultProps = {
    isFullHeight: false,
    size: 'm'
  }

  render() {
    return (
      <div className={css(
        styles.box,
        this.props.isFullHeight ? styles.box_isFullHeight : null
        )}>
        <Loader size={this.props.size}/>
      </div>
    );
  }
}

export default LoaderBox;
