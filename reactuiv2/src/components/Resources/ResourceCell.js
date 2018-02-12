import React, { Component } from 'react';
import {Icon} from 'semantic-ui-react';

class ResourceCell extends Component {
    constructor(props) {
        super(props);
    }
    render() {
        //console.log("props in ResourceCell : ", this.props)
        return (
            <span>
                <Icon name='triangle right' onClick={() => this.props.cellExpanded(this.props)} />
                {this.props.value}
            </span>
        )
    }
}

export default ResourceCell;