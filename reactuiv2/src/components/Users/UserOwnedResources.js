import React, { Component } from 'react';
import { connect } from 'react-redux';

import { Loader, Dimmer, Button, Table, Dropdown, Form, Input, Label, Icon } from 'semantic-ui-react';

import agent from '../../utils/agent';

import {
    USERS_OWNED_RESOURCES_LOAD_START,
    USERS_OWNED_RESOURCES_LOADED,
    USERS_RESOURCE_PAGINATION_DATA,
    USERS_RESOURCE_ACTION_LOAD
} from '../../constants/actionTypes';


const mapStateToProps = state => ({
    ...state.users,
    ...state.common
});

const mapDispatchToProps = dispatch => ({
    onLoadStart: () => dispatch({ type: USERS_OWNED_RESOURCES_LOAD_START }),
    onLoad: (payload) => dispatch({ type: USERS_OWNED_RESOURCES_LOADED, payload }),
    setPaginationData: (pageNumber, pageLimit) =>
        dispatch({ type: USERS_RESOURCE_PAGINATION_DATA, pageNumber, pageLimit }),
    resetPaginationData: (pageNumber, pageLimit) =>
        dispatch({ type: USERS_RESOURCE_PAGINATION_DATA, pageNumber, pageLimit }),
    onChangePermission: (actionType, resource, newValue) =>
        dispatch({ type: USERS_RESOURCE_ACTION_LOAD, actionType, resource, newValue })
});

class UserOwnedResources extends Component {
    constructor(props) {
        super(props);

        this.state = {
            columnHeaders: [
                "Resource",
                "Type",
                "Exposure",
                ""
            ]
        }
    }

    componentWillMount() {
        if (this.props.selectedUserItem) {
            this.props.onLoadStart()
            this.props.onLoad(agent.Resources.getResourcesTree({ 'userEmails': [this.props.selectedUserItem["email"]], 'pageNumber': 0, 'pageSize': 100, 'ownerEmailId': this.props.selectedUserItem["email"],
                                                  'datasourceId': this.props.selectedUserItem["datasource_id"]}))
        }
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.pageNumber !== this.props.pageNumber) {
            nextProps.onLoadStart()
            nextProps.onLoad(agent.Resources.getResourcesTree({ 'userEmails': [this.props.selectedUserItem["email"]],
              'pageNumber': nextProps.pageNumber, 'pageSize': nextProps.pageLimit,
              'ownerEmailId': this.props.selectedUserItem["email"], 'datasourceId': this.props.selectedUserItem["datasource_id"] }))
        }
    }

    componentWillUnmount() {
        this.props.resetPaginationData(0, 100)
    }

    handleNextClick = () => {
        this.props.setPaginationData(this.props.pageNumber+1,this.props.pageLimit)
    }

    handlePreviousClick = () => {
        this.props.setPaginationData(this.props.pageNumber-1,this.props.pageLimit)
    }

    handleEmailChange = (rowData) => {
        this.props.onChangePermission('change_owner', rowData, undefined)
    }

    render() {
        let tableHeaders = this.state.columnHeaders.map((headerName, index) => {
            return (
                <Table.HeaderCell key={index}>{headerName}</Table.HeaderCell>
            )
        })

        const openLink = (link) => function (ev) {
            var win = window.open(link, '_blank');
            if (win) {
                //Browser has allowed it to be opened
                win.focus();
            }
        }

        let tableRowData = null

        if (this.props.selectedUserItem.ownedResources)
            tableRowData = this.props.selectedUserItem.ownedResources.map((rowData, index) => {
                if (this.props.selectedUserItem["email"] === rowData["resource_owner_id"])
                    return (
                        <Table.Row key={index}>
                            <Table.Cell width="3" style={{'wordBreak': 'break-word'}}>{rowData["resource_name"]}</Table.Cell>
                            <Table.Cell width="3">{rowData["resource_type"]}</Table.Cell>
                            <Table.Cell width="2">{rowData["exposure_type"]}</Table.Cell>
                            <Table.Cell textAlign='center' width="4">
                                <Label as='a' color='blue' active onClick={openLink(rowData["web_view_link"])}>View</Label>
                                <Label as='button' color='blue' active onClick={() => this.handleEmailChange(rowData)}>Change Owner</Label>
                            </Table.Cell>
                        </Table.Row>
                    )
                return null
            })

        if (this.props.isLoadingOwnedUsers)
            return (
                <div style={{ height: '200px' }}>
                    <Dimmer active inverted>
                        <Loader inverted content='Loading' />
                    </Dimmer>
                </div>
            )

        if (this.props.selectedUserItem.ownedResources && this.props.selectedUserItem.ownedResources.length)
            return (
                <div>
                    <div>
                        <Table celled selectable striped>
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
                    <div style={{ marginTop: '5px' }} >
                        {this.props.selectedUserItem.ownedResources.length < this.props.pageLimit? null : (<Button color='green' size="mini" style={{float: 'right', width: '80px'}} onClick={this.handleNextClick} >Next</Button>)}
                        {this.props.pageNumber > 0? (<Button color='green' size="mini" style={{float: 'right', width: '80px'}} onClick={this.handlePreviousClick} >Previous</Button>) : null}
                    </div>
                </div>
            )
        else
            return (
                <div style={{ marginLeft: '30%' }}>
                    User is not the owner for any resource
                </div>
            )
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(UserOwnedResources);
