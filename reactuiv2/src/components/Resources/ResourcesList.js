import React, { Component } from 'react';
import { connect } from 'react-redux';

import { Loader, Dimmer } from 'semantic-ui-react';
import { AgGridReact } from "ag-grid-react";
import 'ag-grid/dist/styles/ag-grid.css';
import 'ag-grid/dist/styles/ag-theme-fresh.css';

import agent from '../../utils/agent';
import ResourceCell from './ResourceCell';
import {
    RESOURCES_PAGE_LOADED,
    RESOURCES_PAGE_LOAD_START,
    RESOURCES_TREE_SET_ROW_DATA,
    RESOURCES_SET_FILE_SHARE_TYPE
} from '../../constants/actionTypes';


const mapStateToProps = state => ({
    ...state.resources
});

const mapDispatchToProps = dispatch => ({
    onLoadStart: () => dispatch({ type: RESOURCES_PAGE_LOAD_START }),
    onLoad: (payload) => dispatch({ type: RESOURCES_PAGE_LOADED, payload }),
    setRowData: (payload) => dispatch({ type: RESOURCES_TREE_SET_ROW_DATA, payload }),
    setFileExposureType: (payload) => dispatch({ type: RESOURCES_SET_FILE_SHARE_TYPE, payload })
});

class ResourcesList extends Component {
    constructor(props) {
        super(props);

        this.onCellClicked = this.onCellClicked.bind(this);
    
        this.state = {
            exposureType: undefined,
            resourceType: undefined
        }

        this.columnDefs = [
            {
                headerName: "Name",
                field: "resource_name"
            },
            {
                headerName: "Type",
                field: "resource_type"
            },
            {
                headerName: "Owner",
                field: "resource_owner_id"
            },
            {
                headerName: "ExposureType",
                field: "exposure_type",
                cellStyle: {textAlign: "center"}
            },
            {
                headerName: "Parent Folder",
                field: "parent_name",
                cellStyle: {textAlign: "left"}
            },
            {
                headerName: "Last Modified",
                field: "last_modified_time",
                cellStyle: {textAlign: "left"},
                valueGetter: (params) => {
                    return params.data.last_modified_time.split('T').join(' ')
                }
            }
        ];

        this.gridOptions = {
            onRowClicked: this.onCellClicked
        }
    }

    onCellClicked(params) {
        console.log("cell clicked data : ", params.data)
        this.props.setRowData(params.data)
    }

    onGridReady(params) {
        this.gridApi = params.api;
        this.gridColumnApi = params.columnApi;
        params.api.sizeColumnsToFit();
    }

    componentWillMount() {
        this.props.onLoadStart()
        this.props.setFileExposureType('EXT')
        this.props.onLoad(agent.Resources.getResourcesTree({'userEmails': [], 'exposureType': 'EXT'}))

    }

    componentWillReceiveProps(nextProps) {
        if (nextProps !== this.props) {
            if (nextProps.exposureType && nextProps.exposureType !== this.state.exposureType) {
                this.setState({
                    exposureType: nextProps.exposureType
                })
                nextProps.onLoad(agent.Resources.getResourcesTree({'userEmails': [], 'exposureType': nextProps.exposureType, 'resourceType': nextProps.resourceType?nextProps.resourceType:''}))
            }
            if (nextProps.resourceType !== undefined && nextProps.resourceType !== this.state.resourceType) {
                this.setState({
                    resourceType: nextProps.resourceType
                })
                nextProps.onLoad(agent.Resources.getResourcesTree({'userEmails': [], 'exposureType': this.props.exposureType, 'resourceType': nextProps.resourceType}))
            }
        }
    }

    render() {
        if (this.props.isLoading) {
            return (
                <div className="ag-theme-fresh" style={{ height: '200px' }}>
                    <Dimmer active inverted>
                        <Loader inverted content='Loading' />
                    </Dimmer>
                </div>
            )
        }
        else {
            return (
                <div className="ag-theme-fresh" style={{ "height": document.body.clientHeight }}>
                    <AgGridReact
                        id="myGrid" 
                        //domLayout="autoHeight"
                        rowSelection='single' suppressCellSelection='true'
                        rowData={this.props.resourceTree}
                        columnDefs={this.columnDefs}
                        onGridReady={this.onGridReady.bind(this)}
                        gridOptions={this.gridOptions}
                        pagination={true}
                    />
                </div>
            )
        }

    }
}

export default connect(mapStateToProps, mapDispatchToProps)(ResourcesList);