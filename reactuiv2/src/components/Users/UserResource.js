import React, { Component } from 'react';

import agent from '../../utils/agent'
import ResourceCell from '../Resources/ResourceCell';
import { Loader, Dimmer } from 'semantic-ui-react'

import { connect } from 'react-redux';

import { AgGridReact } from "ag-grid-react";
import 'ag-grid/dist/styles/ag-grid.css';
import 'ag-grid/dist/styles/ag-theme-fresh.css';

import {
    USERS_RESOURCE_LOAD_START,
    USERS_RESOURCE_LOADED
} from '../../constants/actionTypes';


const mapStateToProps = state => ({
    ...state.users
});

const mapDispatchToProps = dispatch => ({
    onLoadStart: (payload) =>
        dispatch({ type: USERS_RESOURCE_LOAD_START, payload }),
    onLoad: (payload) =>
        dispatch({ type: USERS_RESOURCE_LOADED, payload })
});

class UserResource extends Component {
    constructor(props) {
        super(props);
        this.state = {
            columnDefs: [
                {
                    headerName: "Resource",
                    field: "name",
                    cellStyle: { textAlign: "left" },
                    cellRendererFramework: ResourceCell,
                    cellRendererParams: {
                        cellExpandedOrCollapsed: this.cellExpandedOrCollapsed,
                    }
                },
                {
                    headerName: "Owner",
                    field: "resourceOwnerId"
                },
                {
                    headerName: "My permission",
                    field: "myPermission"
                }
            ],
            getNodeChildDetails: function getNodeChildDetails(rowItem) {
                if (rowItem.resourceType == 'folder') {
                    return {
                        group: true,
                        expanded: rowItem.isExpanded,
                        children: rowItem.children || [],
                        key: rowItem.key
                    }
                }
                return null;
            }
        };
    }

    componentWillReceiveProps(nextProps) {
        if (this.props.selectedUserItem["key"] != nextProps.selectedUserItem["key"] && !nextProps.selectedUserItem.resources) {
            nextProps.onLoadStart(nextProps.selectedUserItem["key"])
            nextProps.onLoad(agent.Resources.getResourcesTree({'parentList': [nextProps.selectedUserItem["key"]]}))
        }
    }

    componentWillMount() {
        if (this.props.selectedUserItem && !this.props.selectedUserItem.resources) {
            this.props.onLoadStart(this.props.selectedUserItem["key"])
            this.props.onLoad(agent.Resources.getResourcesTree({'parentList': [this.props.selectedUserItem["key"]]}))
        }
    }

    onGridReady(params) {
        this.gridApi = params.api;
        this.gridColumnApi = params.columnApi;
        params.api.sizeColumnsToFit();
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
            return (
                <div className="ag-theme-fresh">
                    <AgGridReact
                        id="myResourceGrid" domLayout="autoHeight"
                        columnDefs={this.state.columnDefs}
                        rowData={this.props.selectedUserItem.resources}
                        getNodeChildDetails={this.state.getNodeChildDetails}
                        onGridReady={this.onGridReady.bind(this)}
                    />
                </div>
            )
        }
        return null;
    }

}

export default connect(mapStateToProps, mapDispatchToProps)(UserResource);