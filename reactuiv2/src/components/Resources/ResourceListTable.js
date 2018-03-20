import React, { Component } from 'react';
import { connect } from 'react-redux';

import { Loader, Dimmer, Button, Table, Dropdown, Form, Input } from 'semantic-ui-react';

import agent from '../../utils/agent';
import { IntlProvider, FormattedRelative } from 'react-intl';
import ResourceSearch from '../Search/ResourceSearch'

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
            {
                text: 'Externally Shared',
                value: 'EXT'
            },
            {
                text: 'Domain Shared',
                value: 'DOMAIN'
            },
            {
                text: 'Internally Shared',
                value: 'INT'
            },
            {
                text: 'All Files',
                value: 'ALL'
            }
        ]
    }

    componentWillMount() {
        if (!this.props.pageNumber)
            this.props.setPaginationData(0, 100)

        this.props.onLoadStart()
        this.props.onLoad(agent.Resources.getResourcesTree({ 'userEmails': [], 'exposureType': this.props.filterExposureType, 'resourceType': this.props.filterResourceType, 'pageNumber': 0, 'pageSize': 100 }))
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps !== this.props) {
            if (nextProps.filterExposureType !== this.props.filterExposureType || nextProps.filterResourceType !== this.props.filterResourceType ||
                nextProps.pageNumber !== this.props.pageNumber) {
                nextProps.onLoadStart()
                nextProps.onLoad(agent.Resources.getResourcesTree({ 'userEmails': [], 'exposureType': nextProps.filterExposureType, 'resourceType': nextProps.filterResourceType, 'pageNumber': nextProps.pageNumber, 'pageSize': nextProps.pageLimit }))
            }
        }
    }

    handleClick = (event, rowData) => {
        event.preventDefault()
        this.props.setRowData(rowData)
    }

    handleExposureTypeChange = (event, data) => {
        let value = data.value === 'ALL' ? '' : data.value
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
        this.props.setPaginationData(this.props.pageNumber + 1, this.props.pageLimit)
    }

    handlePreviousClick = () => {
        this.props.setPaginationData(this.props.pageNumber - 1, this.props.pageLimit)
    }

    render() {
        let tableHeaders = this.state.columnHeaders.map(headerName => {
            return (
                <Table.HeaderCell>{headerName}</Table.HeaderCell>
            )
        })

        let tableRowData = null
        let resourceData = null

        if (this.props.resourceSearchPayload)
            resourceData = this.props.resourceSearchPayload
        else if (this.props.resourceTree)
            resourceData = this.props.resourceTree

        if (resourceData)
            tableRowData = resourceData.map(rowData => {
                return (
                    <Table.Row onClick={(event) => this.handleClick(event, rowData)} style={this.props.rowData === rowData ? { 'background-color': '#2185d0' } : null}>
                        <Table.Cell>{rowData["resource_name"]}</Table.Cell>
                        <Table.Cell>{rowData["resource_type"]}</Table.Cell>
                        <Table.Cell>{rowData["resource_owner_id"]}</Table.Cell>
                        <Table.Cell textAlign="center">{rowData["exposure_type"]}</Table.Cell>
                        <Table.Cell>{rowData["parent_name"]}</Table.Cell>
                        <Table.Cell><IntlProvider locale='en'><FormattedRelative value={rowData["last_modified_time"]} /></IntlProvider ></Table.Cell>
                    </Table.Row>
                )
            })

        let dimmer = (
            <Dimmer active inverted>
                <Loader inverted content='Loading' />
            </Dimmer>
        )

        return (
            <div>
                <div style={{ 'minHeight': document.body.clientHeight/2, 'maxHeight': document.body.clientHeight, 'overflow': 'auto', 'cursor': 'pointer' }}>
                    <Table celled selectable striped compact='very' sortable>
                        <Table.Header>
                            <Table.Row>
                                {tableHeaders}
                            </Table.Row>
                        </Table.Header>
                        <Table.Body>
                            <Table.Row>
                                <Table.Cell>
                                    <ResourceSearch />
                                </Table.Cell>
                                <Table.Cell>
                                    <Input placeholder='Filter by type...' value={this.state.filterResourceType} onChange={this.handleResourceTypeChange} onKeyPress={this.handleKeyPress} />
                                </Table.Cell>
                                <Table.Cell>
                                    <Input placeholder='Filter by email...' />
                                </Table.Cell>
                                <Table.Cell>
                                    <Dropdown
                                        options={this.exposureFilterOptions}
                                        selection
                                        value={this.props.filterExposureType === '' ? 'ALL' : this.props.filterExposureType}
                                        onChange={this.handleExposureTypeChange}
                                    />
                                </Table.Cell>
                                <Table.Cell>
                                    <Input placeholder='Filter by folder...' />
                                </Table.Cell>
                                <Table.Cell>
                                    <Input placeholder='Filter by date...' />
                                </Table.Cell>
                            </Table.Row>
                            {tableRowData}
                        </Table.Body>
                        {this.props.isLoading ? dimmer : null}
                    </Table>
                </div>
                <div style={{ marginTop: '5px' }} >
                    {(!tableRowData || tableRowData.length < this.props.pageLimit) ? null : (<Button color='green' size="mini" style={{ float: 'right', width: '80px' }} onClick={this.handleNextClick} >Next</Button>)}
                    {this.props.pageNumber !== 0 ? (<Button color='green' size="mini" style={{ float: 'right', width: '80px' }} onClick={this.handlePreviousClick} >Previous</Button>) : null}
                </div>
            </div>
        )
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(ResourcesListTable);