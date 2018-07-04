import React, { Component } from 'react';
import { connect } from 'react-redux';

import { Loader, Dimmer, Button, Table, Dropdown, Form, Input, Label, Icon } from 'semantic-ui-react';
import agent from '../../utils/agent';

import {
    GROUP_MEMBERS_LOAD_START,
    GROUP_MEMBERS_LOADED,
    ADD_GROUP_MEMBER_ACTION,
    REMOVE_GROUP_MEMBER_ACTION
} from '../../constants/actionTypes';


const mapStateToProps = state => ({
    ...state.users
});

const mapDispatchToProps = dispatch => ({
    onLoadStart: () =>
        dispatch({ type: GROUP_MEMBERS_LOAD_START }),
    onLoad: (payload) =>
        dispatch({ type: GROUP_MEMBERS_LOADED, payload }),
    addGroupMember: (actionType, userEmail) =>
        dispatch({ type: ADD_GROUP_MEMBER_ACTION, actionType, userEmail }),
    removeGroupMember: (actionType, memberEmail, memberType) => 
        dispatch({ type: REMOVE_GROUP_MEMBER_ACTION, actionType, memberEmail, memberType })
});

class GroupMembersList extends Component {
    constructor(props) {
        super(props);

        this.state = {
            columnHeaders: [
                "Add/Remove",
                "Email",
                "Member Type",
                "Group Type"
            ],
            memberType: [
                {text: 'INT', value: 'INT'},
                {text: 'EXT', value: 'EXT'}
            ],
            groupType: [
                {text: 'USER', value: 'USER'},
                {text: 'GROUP', value: 'GROUP'}
            ],
            userEmail: ''
        }
    }

    componentWillMount() {
        if (this.props.selectedUserItem) {
            this.props.onLoadStart()
            this.props.onLoad(agent.Users.getGroupMembers(this.props.selectedUserItem['email'], this.props.selectedUserItem['datasource_id']))
        }
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.selectedUserItem !== this.props.selectedUserItem) {
            this.props.onLoadStart()
            this.props.onLoad(agent.Users.getGroupMembers(nextProps.selectedUserItem['email'], nextProps.selectedUserItem['datasource_id']))
        }
    }

    addUserToGroup = (event) => {
        this.props.addGroupMember("add_user_to_group", this.state.userEmail)
    }

    removeMemberFromGroup = (event, memberEmail, memberType) => {
        this.props.removeGroupMember("remove_user_from_group", memberEmail, "member")
    }

    handleChange = (event) => {
        this.setState({
            userEmail: event.target.value
        })
    }

    render() {
        let tableHeaders = this.state.columnHeaders.map((headerName, index) => {
            return (
                <Table.HeaderCell key={index}>{headerName}</Table.HeaderCell>
            )
        })

        let tableRowData = null

        if (this.props.selectedUserItem.groupMembers)
            tableRowData = this.props.selectedUserItem.groupMembers.map((rowData, index) => {
                return (
                    <Table.Row key={index}>
                        <Table.Cell>
                            <Button animated='vertical' basic color='red' onClick={(event) => this.removeMemberFromGroup(event, rowData["email"], rowData["type"])}>
                                <Button.Content hidden>Remove</Button.Content>
                                <Button.Content visible>
                                    <Icon name='remove' />
                                </Button.Content>
                            </Button>
                        </Table.Cell>
                        <Table.Cell>{rowData["email"]}</Table.Cell>
                        <Table.Cell>{rowData["member_type"]}</Table.Cell>
                        <Table.Cell>{rowData["type"]}</Table.Cell>
                    </Table.Row>
                )
            })

        if (this.props.isLoadingGroupMembers)
            return (
                <div style={{ height: '200px' }}>
                    <Dimmer active inverted>
                        <Loader inverted content='Loading' />
                    </Dimmer>
                </div>
            )
        else {
            if (this.props.selectedUserItem.groupMembers && this.props.selectedUserItem.groupMembers.length)
                return (
                    <div>
                        <div>
                            <Table celled selectable striped compact='very'>
                                <Table.Header>
                                    <Table.Row>
                                        {tableHeaders}
                                    </Table.Row>
                                </Table.Header>
                                <Table.Body>
                                    <Table.Row>
                                        <Table.Cell>
                                            <Button animated='vertical' basic color='green' onClick={(event) => {this.addUserToGroup(event)}}>
                                                <Button.Content hidden>Add</Button.Content>
                                                <Button.Content visible>
                                                    <Icon name='plus' />
                                                </Button.Content>
                                            </Button>
                                        </Table.Cell>
                                        <Table.Cell>
                                            <Input fluid placeholder='Enter the new user email' value={this.state.userEmail} onChange={this.handleChange} />
                                        </Table.Cell>
                                        <Table.Cell>
                                            <Dropdown fluid selection options={this.state.memberType} />
                                        </Table.Cell>
                                        <Table.Cell>
                                            <Dropdown fluid selection options={this.state.groupType} />
                                        </Table.Cell>
                                    </Table.Row>
                                    {tableRowData}
                                </Table.Body>
                            </Table>
                        </div>
                    </div>
                )
            else
                return (
                    <div style={{ marginLeft: '30%' }}>
                        Nothing to display
                    </div>
                )
        }
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(GroupMembersList);
