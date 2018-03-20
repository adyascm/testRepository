import React, { Component } from 'react';
import { connect } from 'react-redux';

import { Loader, Dimmer, Button, Table, Dropdown, Form, Input, Label } from 'semantic-ui-react';

import agent from '../../utils/agent';

import {
    USERS_RESOURCE_LOAD_START,
    USERS_RESOURCE_LOADED,
    USERS_RESOURCE_ACTION_LOAD,
    RESOURCES_PAGINATION_DATA
} from '../../constants/actionTypes';


const mapStateToProps = state => ({
    ...state.users,
    ...state.common,
    pageNumber: state.resources.pageNumber,
    pageLimit: state.resources.pageLimit
});

const mapDispatchToProps = dispatch => ({
    onLoadStart: (payload) =>
        dispatch({ type: USERS_RESOURCE_LOAD_START, payload }),
    onLoad: (payload) =>
        dispatch({ type: USERS_RESOURCE_LOADED, payload }),
    onChangePermission: (actionType, resource, newValue) =>
        dispatch({ type: USERS_RESOURCE_ACTION_LOAD, actionType, resource, newValue }),
    setPaginationData: (pageNumber, pageLimit) => 
        dispatch({ type: RESOURCES_PAGINATION_DATA, pageNumber, pageLimit })
});

class UserResourceTable extends Component {
    constructor(props) {
        super(props);

        this.state = {
            columnHeaders: [
                "Resource",
                "Owner",
                "Permission",
                "Exposure",
                ""
            ],
            permissionOptions: [
                { text: 'Can Read', value: 'reader' },
                { text: 'Can Write', value: 'writer' },
                { text: 'Owner', value: 'owner' }
            ]
        }
    }

    componentWillMount() {
        if (this.props.selectedUserItem && !this.props.selectedUserItem.resources) {
            this.props.setPaginationData(0,100)
            this.props.onLoadStart(this.props.selectedUserItem["key"])
            this.props.onLoad(agent.Resources.getResourcesTree({'userEmails': [this.props.selectedUserItem["key"]], 'exposureType': this.props.filterExposureType, 'pageNumber': 0, 'pageSize': 100}))    
        }
    }

    componentWillReceiveProps(nextProps) {
        if ((this.props.selectedUserItem["key"] !== nextProps.selectedUserItem["key"] && !nextProps.selectedUserItem.resources) || 
            nextProps.pageNumber !== this.props.pageNumber) {
            nextProps.onLoadStart(nextProps.selectedUserItem["key"])
            nextProps.onLoad(agent.Resources.getResourcesTree({'userEmails': [nextProps.selectedUserItem["key"]], 'exposureType': nextProps.filterExposureType, 'pageNumber': nextProps.pageNumber, 'pageSize': nextProps.pageLimit}))
        }
        if (nextProps.filterExposureType !== this.props.filterExposureType) {
            nextProps.onLoadStart(nextProps.selectedUserItem["key"])
            nextProps.onLoad(agent.Resources.getResourcesTree({'userEmails': [nextProps.selectedUserItem["key"]], 'exposureType': nextProps.filterExposureType, 'pageNumber': this.props.pageNumber, 'pageSize': this.props.pageLimit}))
        }
    }

    onPermissionChange = (event, resourceData, newValue) => {
        if(newValue !== resourceData["myPermission"])
            this.props.onChangePermission("update_permission_for_user", resourceData, newValue);
    }


    render() {
        let tableHeaders = this.state.columnHeaders.map(headerName => {
            return (
                <Table.HeaderCell>{headerName}</Table.HeaderCell>
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
        
        if (this.props.selectedUserItem.resources)
            tableRowData = this.props.selectedUserItem.resources.map(rowData => {
                return (
                    <Table.Row>
                        <Table.Cell>{rowData["resource_name"]}</Table.Cell>
                        <Table.Cell>{rowData["resource_owner_id"]}</Table.Cell>
                        <Table.Cell textAlign="center">
                            {/* {rowData["myPermission"]} */}
                            <Dropdown fluid selection options={this.state.permissionOptions} value={rowData["myPermission"]} onChange={(event,data) => this.onPermissionChange(event,rowData,data.value)} />
                        </Table.Cell>
                        <Table.Cell>{rowData["exposure_type"]}</Table.Cell>
                        {/* <Table.Cell>{rowData["web_view_link"]}</Table.Cell> */}
                        <Table.Cell><Label as='a' color='blue' active onClick={openLink(rowData["web_view_link"])}>View</Label></Table.Cell>
                    </Table.Row>
                )
            })

        let dimmer = (
            <Dimmer active inverted>
                <Loader inverted content='Loading' />
            </Dimmer>
        )

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
                        {this.props.isLoading ? dimmer : null}
                    </Table>
                </div>
            </div>
        )
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(UserResourceTable);