import React, { Component } from 'react';
import {Icon} from 'semantic-ui-react';

class UserGroupCell extends Component {
    constructor(props) {
        super(props);
    }
    
    render() {
        let expandIcon = this.props.data.isExpanded?"triangle down":"triangle right"
        var leftMargin = 2 * this.props.data.depth + "em";
        if (this.props.data.children && this.props.data.children.length > 0) {
            return (
                <span style={{"marginLeft":leftMargin}}>
                    <Icon name={expandIcon} onClick={()=>this.props.cellExpandedOrCollapsed(this.props)} />
                    <Icon name='group' />
                    {this.props.value}
                </span>
            )
        }
        else {
            return (
                <span style={{"marginLeft":leftMargin}}>
                    <Icon name='user' />
                    {this.props.value}
                </span>
            )
        }
    }
}

export default UserGroupCell;