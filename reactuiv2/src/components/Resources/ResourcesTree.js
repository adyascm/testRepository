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
    RESOURCES_TREE_CELL_EXPANDED
} from '../../constants/actionTypes';


const mapStateToProps = state => ({
    ...state.resources
});

const mapDispatchToProps = dispatch => ({
    onLoadStart: () => dispatch({ type: RESOURCES_PAGE_LOAD_START }),
    onLoad: (parent, payload) => dispatch({ type: RESOURCES_PAGE_LOADED, parent, payload }),
    setRowData: (payload) => dispatch({type:RESOURCES_TREE_SET_ROW_DATA,payload}),
    setCellExpanded: (payload) => dispatch({type:RESOURCES_TREE_CELL_EXPANDED,payload})
});

class ResourcesTree extends Component {
    constructor(props) {
        super(props);

        this.cellExpandedOrCollapsed = this.cellExpandedOrCollapsed.bind(this);
        this.onCellClicked = this.onCellClicked.bind(this);

        this.columnDefs = [
            {
                headerName: "Resource",
                field: "name",
                cellStyle: { textAlign: "left" },
                cellRendererFramework: ResourceCell,
                cellRendererParams: {
                    cellExpandedOrCollapsed: this.cellExpandedOrCollapsed,
                }
            }
        ];

        this.gridOptions = {
            onRowClicked: this.onCellClicked,
            getNodeChildDetails: rowItem => {
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
        }
    }

    onCellClicked(params) {
        this.props.setRowData(params.data)
    }

    cellExpandedOrCollapsed(params) {
        if (!params.data.isExpanded) {
            this.props.setCellExpanded(true);
            this.props.onLoad(params.data, agent.Resources.getResourcesTree({ "parentId": params.data["resourceId"] }))
        }
        else {
            this.props.onLoad(params.data,{})
            this.gridApi.setRowData(this.props.resourceTree)
        }
    }

    onGridReady(params) {
        this.gridApi = params.api;
        this.gridColumnApi = params.columnApi;
        params.api.sizeColumnsToFit();
    }

    componentWillMount() {
        this.props.onLoadStart()
        this.props.onLoad(undefined, agent.Resources.getResourcesTree({}))

    }

    render() {

        if (this.gridApi && this.props.cellExpanded !== undefined && !this.props.cellExpanded) {
            this.gridApi.setRowData(this.props.resourceTree)
        }

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
                <div className="ag-theme-fresh">
                    <AgGridReact
                        id="myGrid" domLayout="autoHeight"
                        rowSelection='single' suppressCellSelection='true'
                        rowData={this.props.resourceTree}
                        columnDefs={this.columnDefs}
                        onGridReady={this.onGridReady.bind(this)}
                        gridOptions={this.gridOptions}
                    />
                </div>
            )
        }

    }
}

export default connect(mapStateToProps, mapDispatchToProps)(ResourcesTree);