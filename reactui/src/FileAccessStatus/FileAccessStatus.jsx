import React, {Component} from 'react';
import { StyleSheet, css } from 'aphrodite/no-important';
import { opacities, colors, spaces, sizes, radii, border } from '../designTokens';
import Icon from '../Icon';

type TFileAccessStatusProps = {
  isReadable: bool,
  isWritable: bool,
  isHidden: bool,
};

const styles = StyleSheet.create({
  wrapper: {
    display: 'inline-flex',
    justifyContent: 'center',
    margin: 0,
    backgroundColor: colors.grey12,
    borderRadius: radii.m,
    opacity: opacities.medium,
    width: sizes.xxs,
  },
  iconWrapper: {
    display: 'inline-flex',
    justifyContent: 'center',
    margin: 0,
    padding: `${spaces.xxxs} ${spaces.xxs}`,
    borderLeft: `${border.width}px ${border.style} ${colors.background}`,
    width: sizes.xxxs,
    ':first-child': {
      borderLeftWidth: 0,
    },
  },
  wrapper_PartialAccess: {
    backgroundColor: colors.warning,
  },
  wrapper_FullAccess: {
    backgroundColor: colors.success,
  },
  wrapper_isHidden: {
    opacity: opacities.transparent
  },
  icon: {
    margin: 0,
    color: colors.backgroundDark
  }
});

class FileAccessStatus extends Component {
  props: TFileAccessStatusProps;

  static defaultProps = {
    isReadable: false,
    isWritable: false
  }

  render() {
    if (!this.props.getShouldShowPermissions()) {
      return null;
    }
    
    const iconEls = [];
    let legend = 'No Access';
    let wrapperClassName = css(styles.wrapper);
    const permissions = this.props.getPermissions(this.props.data);

    if (permissions.isReadable && permissions.isWritable) {
      legend = 'Read and Write';

      wrapperClassName = css(styles.wrapper, styles.wrapper_FullAccess);

      iconEls.push(
        <span className={css(styles.iconWrapper)} key="1">
          <Icon name='access-r' size='xxs' additionalClassNames={css(styles.icon)}/>
        </span>,
        <span className={css(styles.iconWrapper)} key="2">
          <Icon name='access-w' size='xxs' additionalClassNames={css(styles.icon)}/>
        </span>
      );
    } else if (permissions.isReadable) {
      legend = 'Read Only';

      wrapperClassName = css(styles.wrapper, styles.wrapper_PartialAccess);

      iconEls.push(
        <span className={css(styles.iconWrapper)} key="1">
          <Icon name='access-r' size='xxs' additionalClassNames={css(styles.icon)}/>
        </span>
      );
    } else if(this.props.isViewable) {
        legend = 'View Only';
        iconEls.push(
          <span className={css(styles.iconWrapper)} key="1">
            <Icon name='dash' size='xxs' additionalClassNames={css(styles.icon)}/>
          </span>
        );
    } else {
      iconEls.push(
        <span className={css(styles.iconWrapper)} key="1">
          <Icon name='dash' size='xxs' additionalClassNames={css(styles.icon)}/>
        </span>
      );
    }

    if (this.props.isHidden) {
      wrapperClassName = css(styles.wrapper, styles.wrapper_isHidden);
    }

    return (
      <span className={wrapperClassName} title={legend}>
        {iconEls}
      </span>
    );
  }
}

export default FileAccessStatus;
