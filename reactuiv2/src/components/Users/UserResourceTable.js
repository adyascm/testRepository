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
                { text: 'Owner', value: 'owner' },
                { text: 'Can Comment', value: 'commenter' }
            ]
        }
    }

    componentWillMount() {
        if (this.props.selectedUserItem) {
            let filterExposureType = (this.props.selectedUserItem.member_type === 'EXT' ? '' : this.props.filterExposureType)
            this.props.onLoadStart()
            this.props.onLoad(agent.Resources.getResources({
                'accessibleBy': this.props.selectedUserItem["email"], 'exposureType': filterExposureType, 'pageNumber': this.props.pageNumber, 'pageSize': this.props.pageLimit,
                'datasourceId': this.props.selectedUserItem.datasource_id
            }))
        }
    }

    componentWillReceiveProps(nextProps) {
        window.scrollTo(0, 0)
        if ((this.props.selectedUserItem["email"] !== nextProps.selectedUserItem["email"]) ||
            nextProps.pageNumber !== this.props.pageNumber || nextProps.filterExposureType !== this.props.filterExposureType) {
            let filterExposureType = (nextProps.selectedUserItem.member_type === 'EXT' ? '' : nextProps.filterExposureType)
            nextProps.onLoadStart()
            nextProps.onLoad(agent.Resources.getResources({
                'accessibleBy': nextProps.selectedUserItem["email"],
                'exposureType': filterExposureType, 'pageNumber': nextProps.pageNumber, 'pageSize': nextProps.pageLimit,
                'datasourceId': this.props.selectedUserItem.datasource_id
            }))
        }
    }

    componentWillUnmount() {
        this.props.resetPaginationData(0, 100)
    }

    onPermissionChange = (event, resourceData, newValue) => {
        if (newValue !== resourceData["myPermission"])
            this.props.onChangePermission("update_permission_for_user", resourceData, newValue);
    }

    handleNextClick = () => {
        this.props.setPaginationData(this.props.pageNumber + 1, this.props.pageLimit)
    }

    handlePreviousClick = () => {
        this.props.setPaginationData(this.props.pageNumber - 1, this.props.pageLimit)
    }

    render() {
        let ds = this.props.datasourcesMap[this.props.selectedUserItem.datasource_id];
        let tableHeaders = this.state.columnHeaders.map((headerName, index) => {
            if (ds.datasource_type != "GSUITE" && headerName === "Permission") {
                return null;
            }
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

        if (this.props.selectedUserItem.resources)
            tableRowData = this.props.selectedUserItem.resources.map((rowData, index) => {
                if (ds.datasource_type != "GSUITE") {
                    return (<Table.Row key={index}>
                        <Table.Cell style={{ 'wordBreak': 'break-all' }}>{rowData["resource_name"]}</Table.Cell>
                        <Table.Cell >{rowData["resource_owner_id"]}</Table.Cell>
                        <Table.Cell>{rowData["exposure_type"]}</Table.Cell>
                        <Table.Cell><Label as='a' color='blue' active onClick={openLink(rowData["web_view_link"])}>View</Label></Table.Cell>
                    </Table.Row>);
                }
                return (
                    <Table.Row key={index}>
                        <Table.Cell style={{ 'wordBreak': 'break-all' }}>{rowData["resource_name"]}</Table.Cell>
                        <Table.Cell>{rowData["resource_owner_id"]}</Table.Cell>
                        <Table.Cell textAlign="center" width='3' style={{ 'overflow': 'unset' }}>
                            <Dropdown fluid selection options={this.state.permissionOptions} value={rowData["myPermission"]} onChange={(event, data) => this.onPermissionChange(event, rowData, data.value)} />
                        </Table.Cell>
                        <Table.Cell>{rowData["exposure_type"]}</Table.Cell>
                        <Table.Cell><Label as='a' color='blue' active onClick={openLink(rowData["web_view_link"])}>View</Label></Table.Cell>
                    </Table.Row>
                )
            })

        if (this.props.isLoadingUserResources)
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
                    <div>
                        <div>
                            <Table celled selectable striped fixed>
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
                            {this.props.selectedUserItem.resources && this.props.selectedUserItem.resources.length < this.props.pageLimit ? null : (<Button color='green' size="mini" style={{ float: 'right', width: '80px' }} onClick={this.handleNextClick} >Next</Button>)}
                            {this.props.pageNumber > 0 ? (<Button color='green' size="mini" style={{ float: 'right', width: '80px' }} onClick={this.handlePreviousClick} >Previous</Button>) : null}
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

export default connect(mapStateToProps, mapDispatchToProps)(UserResourceTable);
