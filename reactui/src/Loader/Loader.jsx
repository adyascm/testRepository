// @flow
import React, {Component} from 'react';
import { StyleSheet, css } from 'aphrodite/no-important';
import { colors, components, durations } from '../designTokens';
import Icon from '../Icon';

type TLoaderProps = {
  additionalClassNames?: string,
  size?: 'm'| 's' | 'xs' | 'xxs' | 'l',
};

const animationKeyframes = {
  '0%': {
    transform: 'rotate(0deg)'
  },
  '100%': {
    transform: 'rotate(359deg)'
  }
}

const styles = StyleSheet.create({
  loader: {
    display: 'inline-flex',
    margin: 0,
    alignSelf: 'center',
    color: colors.secondary,
  },
  icon: {
    animationName: animationKeyframes,
    animationDuration: durations.slowly,
    animationIterationCount: 'infinite',
    animationTimingFunction: 'linear'
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
});

class Loader extends Component {
  props: TLoaderProps;

  static defaultProps = {
    size: 'm'
  }

  render() {
    let loaderClassName = css(styles.loader, styles[this.props.size]);

    return (
      <span className={loaderClassName}>
        <Icon name='loader'
              size={this.props.size}
              additionalClassNames={css(styles.icon)}/>
      </span>
    );
  }
}

export default Loader;
