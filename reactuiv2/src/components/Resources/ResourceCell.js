import React, { Component } from 'react';
import {Icon} from 'semantic-ui-react';

class ResourceCell extends Component {
    constructor(props) {
        super(props);
    }
    render() {
        let expandIcon = this.props.node.expanded?"triangle down":"triangle right"
        return (
            <span>
                <Icon name={expandIcon} onClick={() => this.props.cellExpanded(this.props)} />
                {this.props.value}
            </span>
        )
    }
}

export default ResourceCell;