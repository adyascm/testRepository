import React, { Component } from 'react';
import {Icon} from 'semantic-ui-react';

class ResourceCell extends Component {
    constructor(props) {
        super(props);
    }
    render() {
        let expandIcon = this.props.data.isExpanded?"triangle down":"triangle right"
        var leftMargin = 2 * this.props.data.depth + "em";
        if(this.props.data.resourceType == 'folder')
        {
            return (
                <span style={{"marginLeft":leftMargin}}>
                    <Icon name={expandIcon} onClick={() => this.props.cellExpandedOrCollapsed(this.props)} />
                    {this.props.value}
                </span>
            )
        }
        
        else{
            return (
                <span style={{"marginLeft":leftMargin}}>
                    <Icon name="minus" />
                    {this.props.value}
                </span>
            )
        }
    }
}

export default ResourceCell;