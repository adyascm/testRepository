import React, { Component } from 'react';
import { connect } from 'react-redux';

import { Loader, Dimmer } from 'semantic-ui-react';
import ReactDataGrid from 'react-data-grid';
//import { Toolbar } from 'react-data-grid-addons';
import Toolbar from './Toolbar';
import DateComponent from './DateComponent';

import agent from '../../utils/agent';
import {
    RESOURCES_PAGE_LOAD_START,
    RESOURCES_PAGE_LOADED,
    RESOURCES_TREE_SET_ROW_DATA,
    RESOURCES_SET_FILE_SHARE_TYPE,
    RESOURCES_SET_FILE_TYPE
} from '../../constants/actionTypes';

const mapStateToProps = state => ({
    ...state.resources
});

const mapDispatchToProps = dispatch => ({
    onLoadStart: () => dispatch({ type: RESOURCES_PAGE_LOAD_START }),
    onLoad: (payload) => dispatch({ type: RESOURCES_PAGE_LOADED, payload }),
    setRowData: (payload) => dispatch({ type: RESOURCES_TREE_SET_ROW_DATA, payload }),
    setFileExposureType: (payload) => dispatch({ type: RESOURCES_SET_FILE_SHARE_TYPE, payload }),
    setResourceType: (payload) => dispatch({ type: RESOURCES_SET_FILE_TYPE, payload })
});

class TestResourcesList extends Component {
    constructor(props) {
        super(props);

        this.state = {
            columns: [
                { 
                    key: 'resource_name', 
                    name: 'Name',
                    //filterable: true 
                },
                { 
                    key: 'resource_type', 
                    name: 'Type' ,
                    editable: true,
                    filterable: true
                }, 
                { 
                    key: 'resource_owner_id', 
                    name: 'Owner',
                    //filterable: true
                },
                {
                    key: 'exposure_type',
                    name: 'ExposureType',
                    filterable: true,
                    //filterRenderer: MultiSelectFilter
                },
                {
                    key: 'parent_name',
                    name: 'Parent Folder',
                    //filterable: true
                },
                {
                    key: 'last_modified_time',
                    name: 'Last Modified',
                    formatter: DateComponent,
                    // filterable: true
                } 
            ],
            exposureType: undefined,
            resourceType: undefined
        }
    }

    componentWillMount() {
        this.props.onLoadStart()
        this.props.setFileExposureType('EXT')
        this.props.onLoad(agent.Resources.getResourcesTree({'userEmails': [], 'exposureType': 'EXT'}))
    }

    // componentDidMount() {
    //     this.grid.onToggleFilter();
    // }

    componentWillReceiveProps(nextProps) {
        if (nextProps !== this.props) {
            if (nextProps.exposureType && nextProps.exposureType !== this.state.exposureType) {
                nextProps.onLoad(agent.Resources.getResourcesTree({'userEmails': [], 'exposureType': nextProps.exposureType, 'resourceType': nextProps.resourceType?nextProps.resourceType:''}))
                this.setState({
                    exposureType: nextProps.exposureType
                })
            }
            if (nextProps.resourcesType !== undefined && nextProps.resourcesType !== this.state.resourceType) {
                nextProps.onLoad(agent.Resources.getResourcesTree({'userEmails': [], 'exposureType': this.props.exposureType, 'resourceType': nextProps.resourcesType}))
                this.setState({
                    resourceType: nextProps.resourcesType
                })
            }
        }
    }

    rowGetter = (index) => {
        return this.props.resourceTree[index]
    };

    onRowClick = (params) => {
        console.log("row data index : ", params)
        console.log("row data ", this.props.resourceTree[params])
        this.props.setRowData(this.props.resourceTree[params])
    }

    handleColumnUpdate = (params) => {
        console.log("updated params : ", params)
    }

    handleFilterChange = (params) => {
        console.log("filter changes : ", params)
        
        if (params['column']['name'] === 'Type')
            this.props.setResourceType(params.filterTerm)
        else 
            this.props.setFileExposureType(params.filterTerm)
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
        return  (
            <ReactDataGrid
                ref={(grid) => { this.grid = grid; }}
                columns={this.state.columns}
                rowGetter={this.rowGetter}
                rowsCount={this.props.resourceTree?this.props.resourceTree.length:0}
                //onRowClick={this.onRowClick}
                enableCellSelect={true}
                onGridRowsUpdated={this.handleColumnUpdate}
                onAddFilter={this.handleFilterChange}
                toolbar={<Toolbar />}
                minHeight={500} />
        );
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(TestResourcesList);