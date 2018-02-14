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
    RESOURCES_TREE_SET_ROW_DATA
} from '../../constants/actionTypes';


const mapStateToProps = state => ({
    ...state.resources
});

const mapDispatchToProps = dispatch => ({
    onLoadStart: () => dispatch({ type: RESOURCES_PAGE_LOAD_START }),
    onLoad: (parent, payload) => dispatch({ type: RESOURCES_PAGE_LOADED, parent, payload })
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
                //cellRenderer: "agGroupCellRenderer",
                cellRendererFramework: ResourceCell,
                cellRendererParams: {
                    cellExpandedOrCollapsed: this.cellExpandedOrCollapsed,
                }
            }
        ];

        this.gridOptions = {
            //onRowClicked: this.onCellClicked,
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
            },
            rowGroupOpened: rowItem => {
                debugger;
            }
        }
    }

    onCellClicked(params) {
        console.log("cell clicked data : ", params.data)
        //this.props.setRowData(params.data)
    }

    cellExpandedOrCollapsed(params) {
        console.log("Cell expanded params: ", params)
        this.props.onLoadStart();
        this.props.onLoad(params.data, agent.Resources.getResourcesTree({ "parentId": params.data["resourceId"] }))
    }

    onGridReady(params) {
        this.gridApi = params.api;
        this.gridColumnApi = params.columnApi;

        params.api.sizeColumnsToFit();
        this.gridApi.setRowData(this.props.resourceTree)
    }

    componentWillMount() {
        this.props.onLoadStart()
        this.props.onLoad(undefined, agent.Resources.getResourcesTree({}))

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
            if (this.gridApi)
                this.gridApi.setRowData(this.props.resourceTree);
            return (
                <div className="ag-theme-fresh">
                    <AgGridReact
                        id="myGrid" domLayout="autoHeight"
                        rowSelection='single' suppressCellSelection='true'
                        columnDefs={this.columnDefs}
                        getNodeChildDetails={this.gridOptions.getNodeChildDetails}
                        onGridReady={this.onGridReady.bind(this)}
                        gridOptions={this.gridOptions}
                    />
                </div>
            )
        }

    }
}

export default connect(mapStateToProps, mapDispatchToProps)(ResourcesTree);