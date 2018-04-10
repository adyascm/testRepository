import React, { Component } from 'react';
import { Tab, Segment, Icon, Grid, Dropdown, Container } from 'semantic-ui-react';
import UserDetails from './UserDetails';
import UserResource from './UserResource';
import UserResourceTable from './UserResourceTable'
//import UserActivity from './UserActivity';
import UserActivityTable from './UserActivityTable'
import UserApps from '../UserApp/UserApps';
import UserOwnedResources from './UserOwnedResources'

import agent from '../../utils/agent'
import { connect } from 'react-redux';
import {
    USER_ITEM_SELECTED,
    USERS_RESOURCE_ACTION_LOAD,
    USERS_RESOURCE_FILTER_CHANGE,
    USERS_GROUP_ACTION_LOAD
} from '../../constants/actionTypes';

const mapStateToProps = state => ({
    ...state.users,
    ...state.common
});

const mapDispatchToProps = dispatch => ({
    closingDetailsSection: (payload) => dispatch({ type: USER_ITEM_SELECTED, payload }),
    onUserQuickAction: (actionType) =>
        dispatch({ type: USERS_RESOURCE_ACTION_LOAD, actionType }),
    changeFilter: (property, value) => dispatch({ type: USERS_RESOURCE_FILTER_CHANGE, property, value }),
    userGroupAction : (actionType, groupId) =>
        dispatch({type: USERS_GROUP_ACTION_LOAD, actionType, groupId})
})

class UsersGroupsDetailsSection extends Component {
    constructor(props) {
        super(props);

        this.state = {
            isLoading: false,
            deleteApp: undefined
        }

        this.exposureFilterOptions = [
            {
                text: 'Externally Shared',
                value: 'EXT'
            },
            {
                text: 'Domain Shared',
                value: 'DOMAIN'
            },
            {
                text: 'Internally Shared',
                value: 'INT'
            },
            {
                text: 'All Files',
                value: 'ALL'
            }
        ]

        this.closeDetailsSection = this.closeDetailsSection.bind(this);
        this.handleAppAccessRevokeClick = this.handleAppAccessRevokeClick.bind(this)
        this.onQuickAction = this.onQuickAction.bind(this);
        this.handleExposureTypeChange = this.handleExposureTypeChange.bind(this);
        this.onUserGroupAction = this.onUserGroupAction.bind(this);
    }

    closeDetailsSection() {
        this.props.closingDetailsSection(undefined)
    }

    handleExposureTypeChange(event, data) {
        let value = data.value === 'ALL'?'':data.value
        if (value !== this.props.filterExposureType)
            this.props.changeFilter("filterExposureType", value);
    }

    onQuickAction(action) {
        if (action !== '')
            this.props.onUserQuickAction(action)
    }

    onUserGroupAction(action, groupId) {
      if(action !== ''){
        this.props.userGroupAction(action, groupId)
      }
    }

    handleAppAccessRevokeClick(event,app,userEmail) {
        this.setState({
            isLoading: true,
            deleteApp: app["display_text"]
        })
        agent.Apps.revokeAppAccess(app.datasource_id, app.client_id,userEmail).then(resp =>{
            app=undefined;
            this.setState({
                isLoading: false,
                deleteApp: undefined
            })
        })
    }

    render() {

        var resourceLayout = (
            <Container stretched="true">
                <Grid stretched>
                    <Grid.Row stretched style={{ marginLeft: '5px' }}>
                      {this.props.selectedUserItem.member_type === 'EXT' ?  null :
                        <Dropdown
                            options={this.exposureFilterOptions}
                            selection
                            onChange={this.handleExposureTypeChange}
                            defaultValue={this.props.filterExposureType === ''?'ALL':this.props.filterExposureType}
                        />
                      }

                    </Grid.Row>
                    <Grid.Row stretched style={{ marginLeft: '5px', marginRight: '5px' }}>
                        {/* <UserResource filterExposureType={this.props.filterExposureType}/> */}
                        <UserResourceTable />
                    </Grid.Row>
                </Grid>
            </Container>
        )

        var ownedResourceLayout = (
            <Container stretched="true">
                <Grid stretched style={{'marginTop': '5px', 'marginBottom': '5px'}}>
                    <UserOwnedResources />
                </Grid>
            </Container>
        )

        if (!this.props.selectedUserItem)
            return null;
        else {
            let userName = this.props.selectedUserItem['first_name']
            let panes = [
                { menuItem: userName + '\'s documents', render: () => <Tab.Pane attached={false}>{ownedResourceLayout}</Tab.Pane> }
            ]
            let extraPanes = [
                { menuItem: 'Accessible documents', render: () => <Tab.Pane attached={false}>{resourceLayout}</Tab.Pane> },
                { menuItem: 'Activity', render: () => <Tab.Pane attached={false}><UserActivityTable /></Tab.Pane> },
                { menuItem: 'Apps', render: () => <Tab.Pane attached={false}><UserApps selectedUser={this.props.selectedUserItem} handleAppAccessRevokeClick={this.handleAppAccessRevokeClick} loading={this.state.isLoading} deleteApp={this.state.deleteApp} /></Tab.Pane> }
            ]

            if ((this.props.selectedUserItem["member_type"] !== 'EXT') && 
                (this.props.selectedUserItem["type"] !== "group"))
                panes.push(...extraPanes)
            else {
                panes.pop()
                panes.push(extraPanes[0])
            } 
                
            return (
                <Segment>
                    {/* <Sticky> */}
                    <Icon name='close' onClick={this.closeDetailsSection} />
                    <UserDetails selectedUserItem={this.props.selectedUserItem} usersTreePayload={this.props.usersTreePayload}
                      onQuickAction={this.onQuickAction} onUserGroupAction={this.onUserGroupAction}/>
                    <Tab menu={{ secondary: true, pointing: true }} panes={panes} />
                    {/* </Sticky> */}
                </Segment>
            )
        }

    }

}

export default connect(mapStateToProps, mapDispatchToProps)(UsersGroupsDetailsSection);
