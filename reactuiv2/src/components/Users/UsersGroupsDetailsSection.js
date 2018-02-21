import React, { Component } from 'react';
import { Tab, Segment, Sticky, Icon } from 'semantic-ui-react';
import UserDetails from './UserDetails';
import UserResource from './UserResource';
import UserActivity from './UserActivity';
import { connect } from 'react-redux';
import {
    USER_ITEM_SELECTED,
    USERS_RESOURCE_ACTION_LOAD
} from '../../constants/actionTypes';

const mapStateToProps = state => ({
    ...state.users,
    ...state.common
});

const mapDispatchToProps = dispatch => ({
    closingDetailsSection: (payload) => dispatch({type:USER_ITEM_SELECTED,payload}),
    onChangePermission: (actionType, resource, newValue) =>
        dispatch({ type: USERS_RESOURCE_ACTION_LOAD, actionType, resource, newValue })
})

class UsersGroupsDetailsSection extends Component {
    constructor(props) {
        super(props);
        
        this.closeDetailsSection = this.closeDetailsSection.bind(this);
        this.handleChange = this.handleChange.bind(this);
    }

    closeDetailsSection() {
        this.props.closingDetailsSection(undefined)
    }

    handleChange(event,data) {
        console.log("item changed: ", data)
        this.props.onChangePermission("transferOwnership", data, data.value)
    }

    render() {
        if (!this.props.selectedUserItem)
            return null;
        else {
            let panes = [
                { menuItem: 'Resources', render: () => <Tab.Pane attached={false}><UserResource /></Tab.Pane> },
                { menuItem: 'Activity', render: () => <Tab.Pane attached={false}><UserActivity /></Tab.Pane> }
            ]
            return (
                <Segment>
                    {/* <Sticky> */}
                        <Icon name='close' onClick={this.closeDetailsSection} />
                        <UserDetails selectedUserItem={this.props.selectedUserItem} usersTreePayload={this.props.usersTreePayload} handleChange={this.handleChange} />
                        <Tab menu={{ secondary: true, pointing: true }} panes={panes} />
                    {/* </Sticky> */}
                </Segment>
            )
        }

    }

}

export default connect(mapStateToProps,mapDispatchToProps)(UsersGroupsDetailsSection);
