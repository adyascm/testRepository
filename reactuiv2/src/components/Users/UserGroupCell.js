import React, { Component } from 'react';
import {Icon} from 'semantic-ui-react';

class UserGroupCell extends Component {
    constructor(props) {
        super(props);
    }
    render() {
        //console.log("props in UserGroupCell : ", this.props)
        return (
            <span>
                <Icon name='triangle right' onClick={()=>this.props.cellExpandedOrCollapsed(this.props)} />
                <Icon name='user' />
                {this.props.value}
            </span>
        )
    }
}

export default UserGroupCell;