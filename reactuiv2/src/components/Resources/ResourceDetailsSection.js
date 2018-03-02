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
    onChangePermissionForResource: (actionType, resource, newValue, email) =>
        dispatch({ type: RESOURCES_ACTION_LOAD, actionType, resource, newValue, email }),
    onResourceQuickAction: (actionType) =>
        dispatch({ type: RESOURCES_ACTION_LOAD, actionType })
})

class ResourceDetailsSection extends Component {
    constructor(props) {
        super(props);
        this.state = {
            rowData: ''
        }
        this.closeDetailsSection = this.closeDetailsSection.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.onQuickAction = this.onQuickAction.bind(this);
        this.handleClick = this.handleClick.bind(this);
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
        this.props.onChangePermissionForResource('update_permission_for_user',data,data["value"],email)
    }

    onQuickAction(action) {
        if (action !== '')
            this.props.onChangePermissionForResource(action)
    }

    handleClick(event,userEmail,permissionType) {
        this.props.onChangePermissionForResource('delete_permission_for_user',permissionType,undefined,userEmail)
    }

    render() {
        let panes = [
            { menuItem: 'Permissions', render: () => <Tab.Pane attached={false}><ResourcePermissions rowData={this.state.rowData} handleChange={this.handleChange} handleClick={this.handleClick}/></Tab.Pane> }
          ]
        return (
            <Segment>
                {/* <Sticky> */}
                    <Icon name='close' onClick={this.closeDetailsSection} />
                    <ResourceDetails rowData={this.props.rowData} onQuickAction={this.onQuickAction} />
                    <Tab menu={{ secondary: true, pointing: true }} panes={panes} />
                {/* </Sticky> */}
            </Segment>
        )
    }
}

export default connect(mapStateToProps,mapDispatchToProps)(ResourceDetailsSection);
