import React, { Component } from 'react';
import { connect } from 'react-redux';

import { Loader, Dimmer, Button, Table, Dropdown, Form, Input, Label } from 'semantic-ui-react';
import DateComponent from '../DateComponent'
import agent from '../../utils/agent';

import {
    USERS_ACTIVITY_LOAD_START,
    USERS_ACTIVITY_LOADED
} from '../../constants/actionTypes';


const mapStateToProps = state => ({
    ...state.users
});

const mapDispatchToProps = dispatch => ({
    onLoadStart: () =>
        dispatch({ type: USERS_ACTIVITY_LOAD_START }),
    onLoad: (payload) =>
        dispatch({ type: USERS_ACTIVITY_LOADED, payload })
});

class UserActivityTable extends Component {
    constructor(props) {
        super(props);

        this.state = {
            columnHeaders: [
                "Date",
                "Operation",
                "Resource",
                "Type",
                "IP Address"
            ]
        }
    }

    componentWillMount() {
        if (this.props.selectedUserItem && !this.props.selectedUserItem.activities) {
            this.props.onLoadStart()
            this.props.onLoad(agent.Activity.getActivitiesForUser(this.props.selectedUserItem["email"]))
        }
    }

    componentWillReceiveProps(nextProps) {
        if (this.props.selectedUserItem["email"] !== nextProps.selectedUserItem["email"] && !nextProps.selectedUserItem.activities) {
            nextProps.onLoadStart()
            nextProps.onLoad(agent.Activity.getActivitiesForUser(nextProps.selectedUserItem["email"]))
        }
    }



    render() {
        let tableHeaders = this.state.columnHeaders.map((headerName, index) => {
            return (
                <Table.HeaderCell key={index}>{headerName}</Table.HeaderCell>
            )
        })

        let tableRowData = null

        if (this.props.selectedUserItem.activities)
            tableRowData = this.props.selectedUserItem.activities.map((rowData, index) => {
                return (
                    <Table.Row key={index}>
                        <Table.Cell><DateComponent value={rowData[0]} /></Table.Cell>
                        <Table.Cell>{rowData[1]}</Table.Cell>
                        <Table.Cell>{rowData[2]}</Table.Cell>
                        <Table.Cell>{rowData[3]}</Table.Cell>
                        <Table.Cell>{rowData[4]}</Table.Cell>
                    </Table.Row>
                )
            })

        if (this.props.isLoadingUserActivities)
            return (
                <div style={{ height: '200px' }}>
                    <Dimmer active inverted>
                        <Loader inverted content='Loading' />
                    </Dimmer>
                </div>
            )
        else {
            if (this.props.selectedUserItem.activities && this.props.selectedUserItem.activities.length)
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

export default connect(mapStateToProps, mapDispatchToProps)(UserActivityTable);
