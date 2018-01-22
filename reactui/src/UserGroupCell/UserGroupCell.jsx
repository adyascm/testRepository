import React, { Component } from 'react';
import { StyleSheet, css } from 'aphrodite/no-important';
import Icon from '../Icon';
import Loader from '../Loader';
import { spaces } from '../designTokens';

const s = StyleSheet.create({
  cellLabel: {
    marginLeft: spaces.xs,
    fontStyle: 'normal'
  }
});

class UserGroupCell extends Component {
  render() {
    let label = this.props.value;

    if (this.props.data.isLoadingIndicator) {
      label = 'Loading ...';
    }
    
    let mimeIconType = this.props.getMimeIcon(this.props.data);

    let mimeIcon = <Icon name={mimeIconType} size="xs" isInline={true} />;
    if (this.props.data.isLoadingIndicator) {
      mimeIcon = <Loader size='xs'/>;
    }

    let expansionButton = <Icon size="xs" isInline={true} />;
    if (this.props.getIsExpandable && this.props.getIsExpandable(this.props.data)) {
      const expansionIconType = this.props.node.expanded ? 'triangle-down' : 'triangle-right';
      expansionButton = <Icon name={expansionIconType}
                              size="xs"
                              onClick={() => this.props.onToggleExpand(this.props)}
                              isInline={true} />;
    }

    const overrideStyles = StyleSheet.create({
      cell: {
        marginLeft: `${this.props.node.level * Number.parseFloat(spaces.m, 10) + Number.parseFloat(spaces.xs, 10)}rem`
      }
    });

    if (this.props.getIsActiveMultiple(this.props) === "source" ?
          this.props.getIsActive(this.props):this.props.getIsActiveMultiple(this.props)) {
      //console.log("Props value in UserGroup Cell : ", this.props);
      this.props.node.selected = true;
    }

    else {
      this.props.node.selected = false;
    }


    return (
      <span className={css(overrideStyles.cell)}>
        {expansionButton}
        {mimeIcon}
        <span className={css(s.cellLabel)}>
          {label}
        </span>
      </span>
    );
  }
}

export default UserGroupCell;
