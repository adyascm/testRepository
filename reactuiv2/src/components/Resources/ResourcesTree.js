import React, {Component} from 'react';
import {connect} from 'react-redux';

import {Loader,Dimmer} from 'semantic-ui-react';
import { AgGridReact } from "ag-grid-react";
import 'ag-grid/dist/styles/ag-grid.css';
import 'ag-grid/dist/styles/ag-theme-fresh.css';

import agent from '../../utils/agent';
import ResourceCell from './ResourceCell';
import { RESOURCES_PAGE_LOADED, 
         RESOURCES_PAGE_LOAD_START,
         RESOURCES_TREE_SET_ROW_DATA } from '../../constants/actionTypes';


const mapStateToProps = state => ({
    ...state.resources
});

const mapDispatchToProps = dispatch => ({
   onLoadStart: () => dispatch({type:RESOURCES_PAGE_LOAD_START}),
   onLoad: (payload) => dispatch({type:RESOURCES_PAGE_LOADED,payload}),
   setRowData: (payload) => dispatch({type:RESOURCES_TREE_SET_ROW_DATA,payload})
});

class ResourcesTree extends Component {
    constructor(props) {
        super(props);

        this.cellExpandedOrCollapsed = this.cellExpandedOrCollapsed.bind(this);
        this.onCellClicked = this.onCellClicked.bind(this);
        
        this.state = {
            resourceTree: ''
        };

        this.columnDefs = [
            {
                headerName: "Resource",
                field: "name",
                cellStyle: {textAlign: "left"},
                //cellRenderer: "agGroupCellRenderer",
                cellRendererFramework: ResourceCell,
                cellRendererParams: {
                  cellExpandedOrCollapsed: this.cellExpandedOrCollapsed,
                }
            }
        ];

        this.gridOptions = {
            onRowClicked: this.onCellClicked
        }
    }

    onCellClicked(params) {
        this.props.setRowData(params.data)
    }

    cellExpandedOrCollapsed(params) {
        console.log("Cell expanded params: ", params)     
    }

    getTreeRows() {
        let rows = [];
        let resourceTreeData = this.props.resourceTree
        if (resourceTreeData) {
            let datasourceId = Object.keys(resourceTreeData)
            resourceTreeData = resourceTreeData[datasourceId]
            var keys = Object.keys(resourceTreeData)

            for (let index=0; index<keys.length; index++) {
                let row = resourceTreeData[keys[index]]
                if (!row.name)
                    row.name = row.resourceName
                rows.push(row)
            }
        }
        return rows;
    }

    onGridReady(params) {
        this.gridApi = params.api;
        this.gridColumnApi = params.columnApi;
    
        params.api.sizeColumnsToFit();
    }
    
    componentWillMount() {
        this.props.onLoadStart()
        this.props.onLoad(agent.Resources.getResourcesTree({}))
        this.setState({
            resourceTree: agent.Resources.getResourcesTree({})
        })

    }

    render() {
        if (this.props.resourceTree !== undefined) {
            let resourceTreeData = this.props.resourceTree
            let datasourceId = Object.keys(resourceTreeData)
            console.log("resource Tree : ", this.props.resourceTree[datasourceId])
        }
        if (!this.props.resourceTree) {
            if (this.props.isLoading) {
                return (
                    <div className="ag-theme-fresh" style={{ height: '200px' }}>
                        <Dimmer active inverted>
                            <Loader inverted content='Loading' />
                        </Dimmer>
                    </div>
                )
            }
        }
        return (
            <div className="ag-theme-fresh">
              <AgGridReact
                id="myGrid" domLayout="autoHeight"
                rowSelection='single' suppressCellSelection='true'
                columnDefs={this.columnDefs}
                rowData={this.getTreeRows()}
                getNodeChildDetails={this.state.getNodeChildDetails}
                onGridReady={this.onGridReady.bind(this)}
                gridOptions={this.gridOptions}
              />
            </div>
        )
    }
}

export default connect(mapStateToProps,mapDispatchToProps)(ResourcesTree);