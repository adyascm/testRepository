import React, {Component} from 'react';
import {Tab,Segment,Sticky,Icon} from 'semantic-ui-react';
import {connect} from 'react-redux';
import ResourcePermissions from './ResourcePermissions';
import ResourceDetails from './ResourceDetails';
import {RESOURCES_TREE_SET_ROW_DATA, RESOURCES_ACTION_LOAD} from '../../constants/actionTypes';

const mapStateToProps = state => ({
    ...state.resources
})

const mapDispatchToProps = dispatch => ({
    closingDetailsSection: (payload) => dispatch({ type:RESOURCES_TREE_SET_ROW_DATA, payload }),
    onChangePermission: (actionType, resource, newValue, email) =>
        dispatch({ type: RESOURCES_ACTION_LOAD, actionType, resource, newValue, email })
})

class ResourcePermissionSection extends Component {
    constructor(props) {
        super(props);
        this.state = {
            rowData: '',
            "Transfer ownership": "transferOwnership",
            "Remove external access": "removeExternalAccess",
            "Remove write access": "removeWriteAccess",
            "Make this private": "makePrivate",
            "Watch all actions": "watchAllActions"  
        }
        this.closeDetailsSection = this.closeDetailsSection.bind(this);
        this.handleChange = this.handleChange.bind(this);
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.rowData) {
            this.setState({
                rowData: nextProps.rowData
            })
        }
    }

    closeDetailsSection() {
        this.props.closingDetailsSection(undefined)
    }

    handleChange(event,data,email) {
        console.log("action event : ", data["value"])
        console.log("permission email: ", email)
        
        if (data["value"] !== "Read" && data["value"] !== "Write")
            this.props.onChangePermission(this.state[data.value],data,data["value"],email)
        else 
            this.props.onChangePermission('resourcePermissionChange',data,data["value"],email)
    }

    render() {
        let panes = [
            { menuItem: 'Permissions', render: () => <Tab.Pane attached={false}><ResourcePermissions rowData={this.state.rowData} handleChange={this.handleChange} /></Tab.Pane> }   
          ]
        return (
            <Segment>
                {/* <Sticky> */}
                    <Icon name='close' onClick={this.closeDetailsSection} />
                    <ResourceDetails rowData={this.props.rowData} handleChange={this.handleChange} />
                    <Tab menu={{ secondary: true, pointing: true }} panes={panes} />
                {/* </Sticky> */}
            </Segment>
        )
    }
}

export default connect(mapStateToProps,mapDispatchToProps)(ResourcePermissionSection);