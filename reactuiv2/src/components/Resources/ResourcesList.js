import React, { Component } from 'react';
import { connect } from 'react-redux';

import { Loader, Dimmer, Button } from 'semantic-ui-react';
import { AgGridReact } from "ag-grid-react";
import 'ag-grid/dist/styles/ag-grid.css';
import 'ag-grid/dist/styles/ag-theme-fresh.css';

import agent from '../../utils/agent';
import DateComponent from '../DateComponent';
import ResourcesExposureFilter from './ResourcesExposureFilter';

import {
    RESOURCES_PAGE_LOADED,
    RESOURCES_PAGE_LOAD_START,
    RESOURCES_TREE_SET_ROW_DATA,
    RESOURCES_PAGINATION_DATA
} from '../../constants/actionTypes';


const mapStateToProps = state => ({
    ...state.resources
});

const mapDispatchToProps = dispatch => ({
    onLoadStart: () => dispatch({ type: RESOURCES_PAGE_LOAD_START }),
    onLoad: (payload) => dispatch({ type: RESOURCES_PAGE_LOADED, payload }),
    setRowData: (payload) => dispatch({ type: RESOURCES_TREE_SET_ROW_DATA, payload }),
    setPaginationData: (pageNumber, pageLimit) => dispatch({ type: RESOURCES_PAGINATION_DATA, pageNumber, pageLimit })
});

class ResourcesList extends Component {
    constructor(props) {
        super(props);

        this.onCellClicked = this.onCellClicked.bind(this);
        this.columnDefs = [
            {
                headerName: "Name",
                field: "resource_name",
                //suppressFilter: true
            },
            {
                headerName: "Type",
                field: "resource_type"
            },
            {
                headerName: "Owner",
                field: "resource_owner_id",
                //suppressFilter: true
            },
            {
                headerName: "ExposureType",
                field: "exposure_type",
                cellStyle: {textAlign: "center"},
                filter: 'dropDownFilter',
                //floatingFilterComponent: ResourcesExposureFilter
            },
            {
                headerName: "Parent Folder",
                field: "parent_name",
                cellStyle: {textAlign: "left"},
                //suppressFilter: true
            },
            {
                headerName: "Last Modified",
                field: "last_modified_time",
                cellStyle: {textAlign: "left"},
                cellRendererFramework: DateComponent,
                //suppressFilter: true
            }
        ];

        this.gridOptions = {
            onRowClicked: this.onCellClicked,
            //floatingFilter: true
        }

        this.state = {
            frameworkComponents: { dropDownFilter: ResourcesExposureFilter }
        }
    }

    onCellClicked(params) {
        this.props.setRowData(params.data)
    }

    onGridReady(params) {
        this.gridApi = params.api;
        this.gridColumnApi = params.columnApi;
        
        if (this.props.gridWidth === 16)
            this.gridApi.sizeColumnsToFit()
    }

    componentWillMount() {
        if (!this.props.pageNumber)
            this.props.setPaginationData(0,100)
        
        this.props.onLoadStart()
        this.props.onLoad(agent.Resources.getResourcesTree({'userEmails': [], 'exposureType': this.props.filterExposureType, 'resourceType': this.props.filterResourceType, 'pageNumber': 0, 'pageSize': 100}))
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps !== this.props) {
            if ( nextProps.filterExposureType !== this.props.filterExposureType || nextProps.filterResourceType !== this.props.filterResourceType || 
                 nextProps.pageNumber !== this.props.pageNumber ) {
                nextProps.onLoadStart()
                nextProps.onLoad(agent.Resources.getResourcesTree({'userEmails': [], 'exposureType': nextProps.filterExposureType, 'resourceType': nextProps.filterResourceType, 'pageNumber': nextProps.pageNumber, 'pageSize': nextProps.pageLimit}))
            }
        }
    }

    handleNextClick = () => {
        this.props.setPaginationData(this.props.pageNumber+1,this.props.pageLimit)
    }

    handlePreviousClick = () => {
        this.props.setPaginationData(this.props.pageNumber-1,this.props.pageLimit)
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
                <div>
                    <div className="ag-theme-fresh" style={{ "height": document.body.clientHeight }}>
                        <AgGridReact
                            id="myGrid" 
                            //domLayout="autoHeight"
                            rowSelection='single' suppressCellSelection='true'
                            //rowData={this.props.resourceTree}
                            rowData={this.props.resourceSearchPayload?this.props.resourceSearchPayload:this.props.resourceTree}
                            columnDefs={this.columnDefs}
                            onGridReady={this.onGridReady.bind(this)}
                            gridOptions={this.gridOptions}
                            //enableFilter={true}
                            //frameworkComponents={this.state.frameworkComponents}
                            // pagination={true}
                        />
                    </div>
                    <div style={{ marginTop: '5px' }} >
                        {(this.props.resourceTree && this.props.resourceTree.length <= this.props.pageLimit)?null:(<Button color='green' size="mini" style={{float: 'right', width: '80px'}} onClick={this.handleNextClick} >Next</Button>)}
                        {this.props.pageNumber !== 0?(<Button color='green' size="mini" style={{float: 'right', width: '80px'}} onClick={this.handlePreviousClick} >Previous</Button>):null}
                    </div>
                </div>
            )
        }

    }
}

export default connect(mapStateToProps, mapDispatchToProps)(ResourcesList);