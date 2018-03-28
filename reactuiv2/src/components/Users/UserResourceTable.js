import React, { Component } from 'react';
import { connect } from 'react-redux';

import { Loader, Dimmer, Button, Table, Dropdown, Form, Input, Label } from 'semantic-ui-react';

import agent from '../../utils/agent';

import {
    USERS_RESOURCE_LOAD_START,
    USERS_RESOURCE_LOADED,
    USERS_RESOURCE_ACTION_LOAD,
    USERS_RESOURCE_PAGINATION_DATA
} from '../../constants/actionTypes';


const mapStateToProps = state => ({
    ...state.users,
    ...state.common
});

const mapDispatchToProps = dispatch => ({
    onLoadStart: () =>
        dispatch({ type: USERS_RESOURCE_LOAD_START }),
    onLoad: (payload) =>
        dispatch({ type: USERS_RESOURCE_LOADED, payload }),
    onChangePermission: (actionType, resource, newValue) =>
        dispatch({ type: USERS_RESOURCE_ACTION_LOAD, actionType, resource, newValue }),
    setPaginationData: (pageNumber, pageLimit) => 
        dispatch({ type: USERS_RESOURCE_PAGINATION_DATA, pageNumber, pageLimit }),
    resetPaginationData: (pageNumber, pageLimit) => 
        dispatch({ type: USERS_RESOURCE_PAGINATION_DATA, pageNumber, pageLimit })
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
            this.props.onLoadStart()
            this.props.onLoad(agent.Resources.getResourcesTree({'userEmails': [this.props.selectedUserItem["key"]], 'exposureType': this.props.filterExposureType, 'pageNumber': this.props.pageNumber, 'pageSize': this.props.pageLimit}))    
        }
    }

    componentWillReceiveProps(nextProps) {
        if ((this.props.selectedUserItem["key"] !== nextProps.selectedUserItem["key"] && !nextProps.selectedUserItem.resources) || 
            nextProps.pageNumber !== this.props.pageNumber || nextProps.filterExposureType !== this.props.filterExposureType) {
            nextProps.onLoadStart()
            nextProps.onLoad(agent.Resources.getResourcesTree({'userEmails': [nextProps.selectedUserItem["key"]], 'exposureType': nextProps.filterExposureType, 'pageNumber': nextProps.pageNumber, 'pageSize': nextProps.pageLimit}))
        }
    }

    componentWillUnmount() {
        this.props.resetPaginationData(0, 100)
    }

    onPermissionChange = (event, resourceData, newValue) => {
        if(newValue !== resourceData["myPermission"])
            this.props.onChangePermission("update_permission_for_user", resourceData, newValue);
    }

    handleNextClick = () => {
        this.props.setPaginationData(this.props.pageNumber+1,this.props.pageLimit)
    }

    handlePreviousClick = () => {
        this.props.setPaginationData(this.props.pageNumber-1,this.props.pageLimit)
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
                        <Table.Cell width='4'>{rowData["resource_name"]}</Table.Cell>
                        <Table.Cell width='5'>{rowData["resource_owner_id"]}</Table.Cell>
                        <Table.Cell textAlign="center" width='3'>
                            {/* {rowData["myPermission"]} */}
                            <Dropdown fluid selection options={this.state.permissionOptions} value={rowData["myPermission"]} onChange={(event,data) => this.onPermissionChange(event,rowData,data.value)} />
                        </Table.Cell>
                        <Table.Cell>{rowData["exposure_type"]}</Table.Cell>
                        {/* <Table.Cell>{rowData["web_view_link"]}</Table.Cell> */}
                        <Table.Cell><Label as='a' color='blue' active onClick={openLink(rowData["web_view_link"])}>View</Label></Table.Cell>
                    </Table.Row>
                )
            })
        
        if (this.props.isResourcesLoading)
            return (
                <div style={{ height: '200px' }}>
                    <Dimmer active inverted>
                        <Loader inverted content='Loading' />
                    </Dimmer>
                </div>
            )
        else {
            if (this.props.selectedUserItem.resources && this.props.selectedUserItem.resources.length)
                return (
                    <div style={{'maxWidth': '100%'}}>
                        <div>
                            <Table celled selectable striped compact="very">
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
                            {this.props.selectedUserItem.resources && this.props.selectedUserItem.resources.length < this.props.pageLimit?null:(<Button color='green' size="mini" style={{float: 'right', width: '80px'}} onClick={this.handleNextClick} >Next</Button>)}
                            {this.props.pageNumber > 0?(<Button color='green' size="mini" style={{float: 'right', width: '80px'}} onClick={this.handlePreviousClick} >Previous</Button>):null}
                        </div>
                    </div>
                )
            else 
                return (
                    <div style={{ marginLeft: '30%' }}>
                        No Resources to display for user 
                    </div>
                )
        }        
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(UserResourceTable);