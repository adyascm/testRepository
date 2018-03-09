import React, { Component } from 'react';

import agent from '../../utils/agent'
import { Loader, Dimmer, Button } from 'semantic-ui-react'

import { connect } from 'react-redux';

import { AgGridReact } from "ag-grid-react";
import 'ag-grid/dist/styles/ag-grid.css';
import 'ag-grid/dist/styles/ag-theme-fresh.css';

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

class UserResource extends Component {
    constructor(props) {
        super(props);

        this.onPermissionChange = this.onPermissionChange.bind(this);
        this.state = {
            columnDefs: [
                {
                    headerName: "Resource",
                    field: "resource_name"
                },
                {
                    headerName: "Owner",
                    field: "resource_owner_id",
                    // editable: true,
                    // onCellValueChanged: this.cellValueChanged
                },
                {
                    headerName: "Permission",
                    field: "myPermission",
                    editable: true,
                    cellEditor: "agSelectCellEditor",
                    cellEditorParams: {
                        values: ['writer','reader', 'owner', 'none']
                    },
                    onCellValueChanged: this.onPermissionChange,
                    cellStyle: {"textAlign":"center"},
                    cellRenderer: (params) => {
                        if (params.value === 'writer')
                            return "Can Write"
                        else if (params.value === 'reader')
                            return "Can Read"
                        else if (params.value === 'owner')
                            return "Owner"
                        else 
                            return "None"
                    }
                },
                {
                    headerName: "Exposure",
                    field: "exposure_type",
                    cellStyle: {"textAlign":"center"}
                },
                {
                    headerName: "",
                    field: "web_view_link",
                    cellRenderer: (params) => {
                        return '<a href='+params.value+' target="_blank">View</a>'
                    },
                    cellStyle: {"textAlign":"center"}
                }
            ]
        };
    }

    onPermissionChange(params) {
        if(params.newValue !== params.oldvalue)
            this.props.onChangePermission("update_permission_for_user", params.data, params.newValue);
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

    componentWillMount() {
        if (this.props.selectedUserItem && !this.props.selectedUserItem.resources) {
            this.props.setPaginationData(0,100)
            this.props.onLoadStart(this.props.selectedUserItem["key"])
            this.props.onLoad(agent.Resources.getResourcesTree({'userEmails': [this.props.selectedUserItem["key"]], 'exposureType': this.props.filterExposureType, 'pageNumber': 0, 'pageSize': 100}))    
        }
    }

    onGridReady(params) {
        this.gridApi = params.api;
        this.gridColumnApi = params.columnApi;
        params.api.sizeColumnsToFit();
    }

    handleNextClick = () => {
        this.props.setPaginationData(this.props.pageNumber+1,this.props.pageLimit)
    }

    handlePreviousClick = () => {
        this.props.setPaginationData(this.props.pageNumber-1,this.props.pageLimit)
    }

    render() {
        if (this.props.isResourcesLoading) {
            return (
                <div className="ag-theme-fresh" style={{ height: '200px' }}>
                    <Dimmer active inverted>
                        <Loader inverted content='Loading' />
                    </Dimmer>
                </div>
            )
        }
        else if (this.props.selectedUserItem){
            if (this.props.selectedUserItem.resources && this.props.selectedUserItem.resources.length)
                return (
                    <div style={{width: '100%'}}>
                        <div className="ag-theme-fresh" > 
                            <AgGridReact
                                id="myResourceGrid" 
                                domLayout="autoHeight"
                                columnDefs={this.state.columnDefs}
                                rowData={this.props.selectedUserItem.resources}
                                onGridReady={this.onGridReady.bind(this)}
                            />
                        </div>
                        <div style={{ marginTop: '5px' }}>
                            {this.props.selectedUserItem.resources && this.props.selectedUserItem.resources.length < this.props.pageLimit?null:(<Button color='green' size="mini" style={{float: 'right', width: '80px'}} onClick={this.handleNextClick} >Next</Button>)}
                            {this.props.pageNumber !== 0?(<Button color='green' size="mini" style={{float: 'right', width: '80px'}} onClick={this.handlePreviousClick} >Previous</Button>):null}
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
        return null;
    }

}

export default connect(mapStateToProps, mapDispatchToProps)(UserResource);