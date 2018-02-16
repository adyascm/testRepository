import React, { Component } from 'react';
import {connect} from 'react-redux';
import {Icon,Loader} from 'semantic-ui-react';

const mapStateToProps = state => ({
    ...state.resources
})

class ResourceCell extends Component {
    constructor(props) {
        super(props);
    }
    render() {
        console.log("cell params : ", this.props.data)
        let expandIcon = this.props.data.isExpanded?"triangle down":"triangle right"
        var leftMargin = 2 * this.props.data.depth + "em";
        if(this.props.data.resourceType === 'folder')
        {
            return (
                <span style={{"marginLeft":leftMargin}}>
                    {
                        (this.props.cellExpanded !== undefined && this.props.cellExpanded &&
                            this.props.rowData && this.props.rowData["resourceId"] === this.props.data["resourceId"])?
                        <Loader size='mini' active inline />
                        :
                        <Icon name={expandIcon} onClick={() => this.props.cellExpandedOrCollapsed(this.props)} />
                    }
                    <Icon name='folder outline' />
                    {this.props.value}
                </span>
            )            
        }
        
        else{
            return (
                <span style={{"marginLeft":leftMargin}}>
                    <Icon name="minus" />
                    <Icon name='file text outline' />
                    {this.props.value}
                </span>
            )
        }
    }
}

export default connect(mapStateToProps)(ResourceCell);