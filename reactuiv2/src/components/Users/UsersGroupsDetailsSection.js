import React, { Component } from 'react';
import { Tab, Segment, Sticky, Icon, Grid, Dropdown, Container } from 'semantic-ui-react';
import UserDetails from './UserDetails';
import UserResource from './UserResource';
import UserActivity from './UserActivity';
import UserApps from './UserApps';
import agent from '../../utils/agent'
import { connect } from 'react-redux';
import {
    USER_ITEM_SELECTED,
    USERS_RESOURCE_ACTION_LOAD,
    USERS_RESOURCE_SET_FILE_SHARE_TYPE
} from '../../constants/actionTypes';

const mapStateToProps = state => ({
    ...state.users,
    ...state.common
});

const mapDispatchToProps = dispatch => ({
    closingDetailsSection: (payload) => dispatch({type:USER_ITEM_SELECTED,payload}),
    onChangePermission: (actionType, resource, newValue) =>
        dispatch({ type: USERS_RESOURCE_ACTION_LOAD, actionType, resource, newValue }),
    setFileExposureType: (payload) => dispatch({ type: USERS_RESOURCE_SET_FILE_SHARE_TYPE, payload })
})

class UsersGroupsDetailsSection extends Component {
    constructor(props) {
        super(props);

        this.state = {
            "Transfer ownership of all owned files": "transfer_ownership",
            "Remove external access for all owned files": "remove_external_access",
            "Remove write access for all un-owned files": "removeWriteAccess",
            "Make all owned files private": "make_all_files_private",
            "Watch all my actions": "watchAllActions",
            options: [
                {text: 'External Shared',
                 value: 'External Shared'},
                {text: 'Domain Shared',
                 value: 'Domain Shared'},
                {text: 'Internally Shared',
                 value: 'Internally Shared'}
            ],
            fileExposureType: {
                'External Shared': 'EXT',
                'Domain Shared': 'DOMAIN',
                'Internally Shared': 'INT'
              }
        }

        this.closeDetailsSection = this.closeDetailsSection.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.handleAppAccessRevokeClick = this.handleAppAccessRevokeClick.bind(this)
    }

    closeDetailsSection() {
        this.props.closingDetailsSection(undefined)
    }

    handleChange(event,data) {
        if (this.state.fileExposureType[data.value])
            this.props.setFileExposureType(this.state.fileExposureType[data.value])
        else
            this.props.onChangePermission(this.state[data.value], data, data.value)
    }

    handleAppAccessRevokeClick(event,application) {
        agent.Users.revokeAppAccess(application).then(resp =>{
            console.log(resp)
        })
    }

    render() {
        var resourceLayout = (
            <Container stretched>
                <Grid stretched>
                    <Grid.Row stretched style={{marginLeft: '5px'}}>
                        <Dropdown
                            options={this.state.options}
                            selection
                            onChange={this.handleChange}
                            defaultValue={!this.props.exposureType || this.props.exposureType === 'EXT'?"External Shared":
                                        this.props.exposureType === 'DOMAIN'?"Domain Shared":"Internally Shared"}
                        />
                    </Grid.Row>
                    <Grid.Row stretched style={{marginLeft: '5px', marginRight: '5px'}}>
                        <UserResource />
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
                        <UserDetails selectedUserItem={this.props.selectedUserItem} usersTreePayload={this.props.usersTreePayload} handleChange={this.handleChange} />
                        <Tab menu={{ secondary: true, pointing: true }} panes={panes} />
                    {/* </Sticky> */}
                </Segment>
            )
        }

    }

}

export default connect(mapStateToProps,mapDispatchToProps)(UsersGroupsDetailsSection);
