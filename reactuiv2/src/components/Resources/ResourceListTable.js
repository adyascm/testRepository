import React, { Component } from 'react';
import { connect } from 'react-redux';

import { Loader, Dimmer, Button, Table, Dropdown, Form } from 'semantic-ui-react';

import agent from '../../utils/agent';
import DateComponent from '../DateComponent';

import {
    RESOURCES_PAGE_LOADED,
    RESOURCES_PAGE_LOAD_START,
    RESOURCES_TREE_SET_ROW_DATA,
    RESOURCES_PAGINATION_DATA,
    RESOURCES_FILTER_CHANGE
} from '../../constants/actionTypes';


const mapStateToProps = state => ({
    ...state.resources
});

const mapDispatchToProps = dispatch => ({
    onLoadStart: () => dispatch({ type: RESOURCES_PAGE_LOAD_START }),
    onLoad: (payload) => dispatch({ type: RESOURCES_PAGE_LOADED, payload }),
    setRowData: (payload) => dispatch({ type: RESOURCES_TREE_SET_ROW_DATA, payload }),
    setPaginationData: (pageNumber, pageLimit) => dispatch({ type: RESOURCES_PAGINATION_DATA, pageNumber, pageLimit }),
    changeFilter: (property, value) => dispatch({ type: RESOURCES_FILTER_CHANGE, property, value })
});

class ResourcesListTable extends Component {
    constructor(props) {
        super(props);

        this.state = {
            columnHeaders: [
                "Name",
                "Type",
                "Owner",
                "Exposure Type",
                "Parent Folder",
                "Last Modified"
            ],
            filterResourceType: ""
        }

        this.exposureFilterOptions = [
            {text: 'Externally Shared',
             value: 'EXT'},
            {text: 'Domain Shared',
             value: 'DOMAIN'},
            {text: 'Internally Shared',
             value: 'INT'},
             {text: 'All Files',
             value: 'ALL'}
          ]
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

    handleClick = (event,rowData) => {
        this.props.setRowData(rowData)
    }

    handleExposureTypeChange = (event,data) => {
        let value = data.value === 'ALL'?'':data.value
        if (value !== this.props.filterExposureType)
          this.props.changeFilter("filterExposureType", value);
    }
    
    handleResourceTypeChange = (event) => {
        this.setState({
          filterResourceType: event.target.value
        });
    }

    handleKeyPress = (event) => {
        if (event.key === 'Enter') {
          this.props.changeFilter("filterResourceType", this.state.filterResourceType);
        }
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

        let tableRowData = null

        if (this.props.resourceTree)
            tableRowData = this.props.resourceTree.map(rowData => {
                return (
                    <Table.Row onClick={(event) => this.handleClick(event,rowData)}>
                        <Table.Cell>{rowData["resource_name"]}</Table.Cell>
                        <Table.Cell>{rowData["resource_type"]}</Table.Cell>
                        <Table.Cell>{rowData["resource_owner_id"]}</Table.Cell>
                        <Table.Cell textAlign="center">{rowData["exposure_type"]}</Table.Cell>
                        <Table.Cell>{rowData["parent_name"]}</Table.Cell>
                        <Table.Cell><DateComponent value={rowData["last_modified_time"]} /></Table.Cell>
                    </Table.Row>
                )
            })

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
                    <div style={{'maxHeight': document.body.clientHeight, 'overflow': 'scroll', 'cursor': 'pointer' }}>
                        <Table celled selectable striped>
                            <Table.Header>
                                <Table.Row>
                                    {tableHeaders}
                                </Table.Row>
                            </Table.Header>
                            <Table.Body>
                                <Table.Row>
                                    <Table.Cell></Table.Cell>
                                    <Table.Cell>
                                        <Form>
                                            <Form.Field>
                                            <input placeholder='Filter by File type ...' value={this.state.filterResourceType} onChange={this.handleResourceTypeChange} onKeyPress={this.handleKeyPress} />
                                            </Form.Field>
                                        </Form>
                                    </Table.Cell>
                                    <Table.Cell></Table.Cell>
                                    <Table.Cell>
                                        <Dropdown
                                            options={this.exposureFilterOptions}
                                            selection
                                            value={this.props.filterExposureType === ''?'ALL':this.props.filterExposureType}
                                            onChange={this.handleExposureTypeChange}
                                        />
                                    </Table.Cell>
                                    <Table.Cell></Table.Cell>
                                    <Table.Cell></Table.Cell>
                                </Table.Row>
                                {tableRowData}
                            </Table.Body>    
                        </Table>
                    </div>
                    <div style={{ marginTop: '5px' }} >
                        {(this.props.resourceTree && this.props.resourceTree.length < this.props.pageLimit)?null:(<Button color='green' size="mini" style={{float: 'right', width: '80px'}} onClick={this.handleNextClick} >Next</Button>)}
                        {this.props.pageNumber !== 0?(<Button color='green' size="mini" style={{float: 'right', width: '80px'}} onClick={this.handlePreviousClick} >Previous</Button>):null}
                    </div>
                </div>
            )
        }

    }
}

export default connect(mapStateToProps, mapDispatchToProps)(ResourcesListTable);