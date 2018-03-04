import React, { Component } from 'react';
import { Tab, Segment, Sticky, Icon, Grid, Dropdown, Container } from 'semantic-ui-react';
import UserDetails from './UserDetails';
import UserResource from './UserResource';
import UserActivity from './UserActivity';
import UserApps from '../UserApp/UserApps';
import agent from '../../utils/agent'
import { connect } from 'react-redux';
import {
    USER_ITEM_SELECTED,
    USERS_RESOURCE_ACTION_LOAD,
    RESOURCES_FILTER_CHANGE
} from '../../constants/actionTypes';

const mapStateToProps = state => ({
    ...state.users,
    ...state.common,
    ...state.resources
});

const mapDispatchToProps = dispatch => ({
    closingDetailsSection: (payload) => dispatch({ type: USER_ITEM_SELECTED, payload }),
    onUserQuickAction: (actionType) =>
        dispatch({ type: USERS_RESOURCE_ACTION_LOAD, actionType }),
    changeFilter: (property, value) => dispatch({ type: RESOURCES_FILTER_CHANGE, property, value }),
})

class UsersGroupsDetailsSection extends Component {
    constructor(props) {
        super(props);

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
            }
        ]

        this.closeDetailsSection = this.closeDetailsSection.bind(this);
        this.handleAppAccessRevokeClick = this.handleAppAccessRevokeClick.bind(this)
        this.onQuickAction = this.onQuickAction.bind(this);
        this.handleExposureTypeChange = this.handleExposureTypeChange.bind(this);
    }

    closeDetailsSection() {
        this.props.closingDetailsSection(undefined)
    }

    handleExposureTypeChange(event, data) {
        if (data && data.value !== this.props.filterExposureType)
            this.props.changeFilter("filterExposureType", data.value);
    }

    onQuickAction(action) {
        if (action !== '')
            this.props.onUserQuickAction(action)
    }

    handleAppAccessRevokeClick(event,application) {
        agent.Apps.revokeAppAccess(application).then(resp =>{
            console.log(resp)
        })
    }

    render() {
        var resourceLayout = (
            <Container stretched>
                <Grid stretched>
                    <Grid.Row stretched style={{ marginLeft: '5px' }}>
                        <Dropdown
                            options={this.exposureFilterOptions}
                            selection
                            onChange={this.handleExposureTypeChange}
                            defaultValue={this.props.filterExposureType}
                        />
                    </Grid.Row>
                    <Grid.Row stretched style={{ marginLeft: '5px', marginRight: '5px' }}>
                        <UserResource filterExposureType={this.props.filterExposureType}/>
                    </Grid.Row>
                </Grid>
            </Container>
        )

        if (!this.props.selectedUserItem)
            return null;
        else {
            let panes = [
                { menuItem: 'Resources', render: () => <Tab.Pane attached={false}>{resourceLayout}</Tab.Pane> },
                { menuItem: 'Activity', render: () => <Tab.Pane attached={false}><UserActivity /></Tab.Pane> },
                { menuItem: 'Apps', render: () => <Tab.Pane attached={false}><UserApps selectedUser={this.props.selectedUserItem} handleAppAccessRevokeClick={this.handleAppAccessRevokeClick} /></Tab.Pane> },
            ]
            return (
                <Segment>
                    {/* <Sticky> */}
                    <Icon name='close' onClick={this.closeDetailsSection} />
                    <UserDetails selectedUserItem={this.props.selectedUserItem} usersTreePayload={this.props.usersTreePayload} onQuickAction={this.onQuickAction} />
                    <Tab menu={{ secondary: true, pointing: true }} panes={panes} />
                    {/* </Sticky> */}
                </Segment>
            )
        }

    }

}

export default connect(mapStateToProps, mapDispatchToProps)(UsersGroupsDetailsSection);
