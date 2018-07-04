import React, { Component } from 'react';
import { Tab, Segment, Icon, Grid, Dropdown, Container, Label, Item, Header } from 'semantic-ui-react';
import UserResourceTable from './UserResourceTable'
import GroupMembersList from './GroupMembersList'
import Mustache from 'mustache';

import agent from '../../utils/agent'
import { connect } from 'react-redux';
import {
    USER_ITEM_SELECTED,
    USERS_RESOURCE_ACTION_LOAD,
    USERS_RESOURCE_FILTER_CHANGE,
    USERS_GROUP_ACTION_LOAD,
    REMOVE_GROUP_MEMBER_ACTION,
    APPS_ACTION_LOAD
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
    userGroupAction: (actionType, groupId) =>
        dispatch({ type: USERS_GROUP_ACTION_LOAD, actionType, groupId }),
    removeUserFromApp: (payload, userEmail, appId, datasourceId) =>
        dispatch({ type: APPS_ACTION_LOAD, actionType: payload, email: userEmail, appId: appId, datasourceId: datasourceId}),
    removeGroupMember: (actionType, memberEmail, memberType) => 
        dispatch({ type: REMOVE_GROUP_MEMBER_ACTION, actionType, memberEmail, memberType })
})

class GroupsDetails extends Component {
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
                text: 'Publicly Shared',
                value: 'PUBLIC'
            },
            {
                text: 'Anyone With Link Shared',
                value: 'ANYONEWITHLINK'
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
        let value = data.value === 'ALL' ? '' : data.value
        if (value !== this.props.filterExposureType)
            this.props.changeFilter("filterExposureType", value);
    }

    onQuickAction(action) {
        if (action !== '')
            this.props.onUserQuickAction(action)
    }

    onUserGroupAction(action, groupId) {
        if (action !== '') {
            this.props.userGroupAction(action, groupId)
        }
    }

    handleAppAccessRevokeClick(event, app, userEmail, datasource_id) {
        this.props.removeUserFromApp("remove_user_from_app", userEmail, app.id, datasource_id)
    }

    removeMemberFromGroup = (event, parentEmail) => {
        this.props.removeGroupMember('remove_user_from_group', parentEmail, "parent")
    }

    render() {

        if (!this.props.selectedUserItem)
            return null

        var resourceLayout = (
            <Container stretched="true">
                <Grid stretched>
                    <Grid.Row stretched style={{ marginLeft: '5px' }}>
                        {this.props.selectedUserItem.member_type === 'EXT' ? null :
                            <Dropdown
                                options={this.exposureFilterOptions}
                                selection
                                onChange={this.handleExposureTypeChange}
                                defaultValue={this.props.filterExposureType === '' ? 'ALL' : this.props.filterExposureType}
                            />
                        }

                    </Grid.Row>
                    <Grid.Row stretched style={{ marginLeft: '5px', marginRight: '5px' }}>
                        <UserResourceTable />
                    </Grid.Row>
                </Grid>
            </Container>
        )

        if (!this.props.selectedUserItem)
            return null;
        else {
            let userName = this.props.selectedUserItem['first_name']
            let ds = this.props.datasourcesMap[this.props.selectedUserItem.datasource_id];
            let panes = [];
            panes.push({ menuItem: 'Members', render: () => <Tab.Pane attached={false}><GroupMembersList /></Tab.Pane> });
            panes.push({ menuItem: 'Accessible documents', render: () => <Tab.Pane attached={false}>{resourceLayout}</Tab.Pane> });

            var image = null;
            if (this.props.selectedUserItem.photo_url) {
                image = <Item.Image inline floated='right' size='mini' src={this.props.selectedUserItem.photo_url} circular></Item.Image>
            } else {
                image = <Item.Image floated='right' size='tiny' ><Label style={{ fontSize: '2rem' }} circular >{this.props.selectedUserItem.full_name && this.props.selectedUserItem.full_name.charAt(0)}</Label></Item.Image>
            }

            var actionMenu = []; //props.selectedUserItem.member_type === 'EXT' ? quickActionsforExtUser : quickActions
            var actionKeys = Object.keys(this.props.all_actions_list)
            var ds = this.props.datasourcesMap[this.props.selectedUserItem.datasource_id];
            for (var ii = 0; ii < actionKeys.length; ii++) {
                var action = this.props.all_actions_list[actionKeys[ii]];
                if (action.datasource_type == ds.datasource_type) {
                    if (action.action_type == "QUICK_ACTION") {
                        if (action.action_entity == "GROUP") {
                            actionMenu.push({ "text": Mustache.render(action.description, this.props.selectedUserItem), "value": action.key });
                        }
                    }
                }
            }
            let parentGroups = []
            if (this.props.selectedUserItem.groups.length) {
                parentGroups = this.props.selectedUserItem.groups.map((group,index) => {
                    return (
                        <Label key={index} as='a' color='blue'>
                            {group["full_name"]}
                            <Icon name='close' onClick={(event) => this.removeMemberFromGroup(event,group["email"])} />
                        </Label>
                    )
                })
            }
            else {
                parentGroups.push((
                    <Label key="-1" color='orange'>
                        None
                    </Label>
                ));
            }
            return (
                <Segment fluid="true">
                    <Icon style={{'position': 'relative', 'left': '33rem', 'cursor': 'pointer'}} name='close' onClick={this.closeDetailsSection} />
                    <div style={{'textAlign': 'left'}}>
                        <Item.Group>
                            <Item fluid='true'>
                                {image}
                                <Item.Content >
                                    <Item.Header >
                                        {this.props.selectedUserItem.full_name}
                                    </Item.Header>
                                    <Item.Meta >
                                        {this.props.selectedUserItem.email}
                                    </Item.Meta>
                                    <Item.Description >
                                        <Header size="tiny" floated="left">Member of </Header>
                                        <Label.Group >
                                            {parentGroups}
                                            <Label as='a' color='green' style={{ 'paddingRight': '2px' }}>
                                                <Icon name='plus' fitted={true} />
                                            </Label>
                                        </Label.Group>
                                    </Item.Description>
                                    <Item.Extra extra="true">
                                        <Dropdown placeholder='Quick Actions...' fluid selection options={actionMenu} value='' onChange={(event, data) => this.props.onQuickAction(data.value)} selectOnBlur={false} />
                                    </Item.Extra>
                                </Item.Content>
                            </Item>
                        </Item.Group>
                    </div>
                    <div style={{'marginTop': '20px'}} >
                        <Tab menu={{ secondary: true, pointing: true }} panes={panes} />
                    </div>
                </Segment>
            )
        }

    }

}

export default connect(mapStateToProps, mapDispatchToProps)(GroupsDetails);
