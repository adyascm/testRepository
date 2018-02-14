import React, { Component } from 'react';
import {Icon} from 'semantic-ui-react';

class ResourceCell extends Component {
    constructor(props) {
        super(props);
    }
    render() {
        //let expandIcon = this.props.isNodeExpanded?"triangle down":"triangle right"
        return (
            <span>
                <Icon name="triangle right" onClick={() => this.props.cellExpandedOrCollapsed(this.props)} />
                {this.props.value}
            </span>
        )
    }
}

export default ResourceCell;