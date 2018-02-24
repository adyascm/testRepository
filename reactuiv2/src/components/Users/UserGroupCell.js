import React, { Component } from 'react';
import { Icon } from 'semantic-ui-react';

class UserGroupCell extends Component {
    render() {
        let expandIcon = this.props.data.isExpanded ? "triangle down" : "triangle right"
        var leftMargin = 2 * this.props.data.depth + "em";
        if (this.props.data.children && this.props.data.children.length > 0) {
            return (
                <span style={{ "marginLeft": leftMargin }}>
                    <Icon name={expandIcon} onClick={() => this.props.cellExpandedOrCollapsed(this.props)} />
                    <Icon name='group' />
                    {this.props.data.name}
                </span>
            )
        }
        else if (this.props.data.type === "group") {
            return (
                <span style={{ "marginLeft": leftMargin }}>
                    <Icon />
                    <Icon name='group' />
                    {this.props.value}
                </span>
            )
        }
        else {
            return (
                <span style={{ "marginLeft": leftMargin }}>
                    <Icon />
                    <Icon name='user' />
                    {this.props.data.name}
                </span>
            )
        }
    }
}

export default UserGroupCell;