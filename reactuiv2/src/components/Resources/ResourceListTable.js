import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Loader, Dimmer, Button, Table, Dropdown, Input, Icon, Sticky, Image } from 'semantic-ui-react';

import agent from '../../utils/agent';
import { IntlProvider, FormattedRelative } from 'react-intl';
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import ResourceSearch from '../Search/ResourceSearch'
import GroupSearch from '../Search/GroupSearch';
import ExportCsvModal from '../ExportCsvModal'

import {
    RESOURCES_PAGE_LOADED,
    RESOURCES_PAGE_LOAD_START,
    RESOURCES_TREE_SET_ROW_DATA,
    RESOURCES_PAGINATION_DATA,
    RESOURCES_FILTER_CHANGE,
    GROUP_SEARCH_EMPTY
} from '../../constants/actionTypes';


const mapStateToProps = state => ({
    ...state.resources,
    ...state.common,
    selectedUser: state.users.selectedUserItem
});

const mapDispatchToProps = dispatch => ({
    onLoadStart: () => dispatch({ type: RESOURCES_PAGE_LOAD_START }),
    onLoad: (payload) => dispatch({ type: RESOURCES_PAGE_LOADED, payload }),
    setRowData: (payload) => dispatch({ type: RESOURCES_TREE_SET_ROW_DATA, payload }),
    setPaginationData: (pageNumber, pageLimit) => dispatch({ type: RESOURCES_PAGINATION_DATA, pageNumber, pageLimit }),
    resetPaginationData: (pageNumber, pageLimit) => dispatch({ type: RESOURCES_PAGINATION_DATA, pageNumber, pageLimit }),
    changeFilter: (property, value) => dispatch({ type: RESOURCES_FILTER_CHANGE, property, value }),
    clearGroupSearchPayload: () => dispatch({ type: GROUP_SEARCH_EMPTY })
});

class ResourcesListTable extends Component {
    constructor(props) {
        super(props);

        this.state = {
            columnHeaders: [
                "Source",
                "Name",
                "Type",
                "Owner",
                "Exposure Type",
                "Parent Folder",
                "Modified On or Before"
            ],
            filterResourceType: "",
            filterEmailId: "",
            filterParentFolder: "",
            currentDate: "",
            columnHeaderDataNameMap: {
                "Source": "source_type",
                "Name": "resource_name",
                "Type": "resource_type",
                "Owner": "resource_owner_id",
                "Exposure Type": "exposure_type",
                "Parent Folder": "parent_name",
                "Modified On or Before": "last_modified_time"
            },
            columnNameClicked: undefined,
            sortOrder: undefined
        }

        this.exposureFilterOptions = [
            {
                text: 'Externally Shared',
                value: 'EXT'
            },
            {
                text: 'Publicly Shared',
                value: 'PUBLIC'
            },
            {
                text: 'Anyone With Link Shared',
                value: 'ANYONEWITHLINK'
            },
            {
                text: 'Trusted Domain Shared',
                value: 'TRUST'
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
        this.props.onLoadStart()
        this.props.onLoad(agent.Resources.getResources({ 
            'exposureType': this.props.filterExposureType, 
            'resourceType': this.props.filterResourceType, 
            'datasourceId': this.props.filterSourceType 
        }, this.props.pageNumber))
    }

    componentWillUnmount() {
        this.props.resetPaginationData(0, 100)
        this.props.clearGroupSearchPayload()
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps !== this.props) {
            if (nextProps.filterExposureType !== this.props.filterExposureType || nextProps.filterResourceType !== this.props.filterResourceType ||
                nextProps.pageNumber !== this.props.pageNumber || nextProps.selectedUser !== this.props.selectedUser || nextProps.filterParentFolder !== this.props.filterParentFolder || nextProps.filterByDate !== this.props.filterByDate ||
                ((nextProps.prefix !== this.props.prefix) && nextProps.prefix === undefined) || nextProps.filterSourceType !== this.props.filterSourceType) {
                let ownerEmailId = nextProps.selectedUser && (nextProps.selectedUser !== this.props.selectedUser) ? nextProps.selectedUser.email : ''
                nextProps.onLoadStart()
                nextProps.onLoad(agent.Resources.getResources({ 
                    'exposureType': nextProps.filterExposureType, 
                    'resourceType': nextProps.filterResourceType, 
                    'ownerEmailId': ownerEmailId, 
                    'parentFolder': nextProps.filterParentFolder, 
                    'selectedDate': nextProps.filterByDate, 
                    'prefix': nextProps.prefix, 
                    'datasourceId': nextProps.filterSourceType 
                }, nextProps.pageNumber, nextProps.pageLimit, this.state.columnNameClicked, (this.state.sortOrder === 'ascending' ? 'asc' : 'desc')))
            }

            if (nextProps.filterResourceType !== this.state.filterResourceType)
                this.setState({
                    filterResourceType: nextProps.filterResourceType
                })
        }
    }

    componentDidUpdate(prevProps) {
        if (prevProps.rowData === this.props.rowData)
            if (this.refs.table)
                this.refs.table.scrollTop = 0
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

    handleParentFolderChange = (event) => {
        this.setState({
            filterParentFolder: event.target.value
        })
    }

    handleSourceTypeChange = (event, data) => {
        this.props.changeFilter("filterSourceType", data.value)
    }

    handleDateChange = (date) => {
        let selectedDate = date ? date.format('YYYY-MM-DD HH:MM:SS') : ''
        this.setState({
            currentDate: date ? date : ''
        })
        this.props.changeFilter("filterByDate", selectedDate)
    }

    handleKeyPress = (event, filterType, filterValue) => {
        if (event.key === 'Enter') {
            this.props.changeFilter(filterType, filterValue);
        }
    }

    handleNextClick = () => {
        this.props.setPaginationData(this.props.pageNumber + 1, this.props.pageLimit)
    }

    handlePreviousClick = () => {
        this.props.setPaginationData(this.props.pageNumber - 1, this.props.pageLimit)
    }

    clearFilterData = (stateKey) => {
        if (stateKey === 'filterResourceType')
            this.setState({
                filterResourceType: ''
            })
        else if (stateKey === 'filterEmailId')
            this.setState({
                filterEmailId: ''
            })
        else if (stateKey === 'filterParentFolder')
            this.setState({
                filterParentFolder: ''
            })
        if (this.props[stateKey] !== '')
            this.props.changeFilter(stateKey, '')
    }

    handleColumnSort = (mappedColumnName) => {
        let ownerEmailId = this.props.selectedUser ? this.props.selectedUser.email : ''
        let sortType = 'asc';
        if (this.state.columnNameClicked === mappedColumnName) {
            sortType = this.state.sortOrder === 'ascending' ? 'desc' : 'asc';
        }
        this.props.onLoadStart()

        this.props.onLoad(agent.Resources.getResources({
            'exposureType': this.props.filterExposureType,
            'resourceType': this.props.filterResourceType,
            'ownerEmailId': ownerEmailId,
            'parentFolder': this.props.filterParentFolder,
            'selectedDate': this.props.filterByDate,
            'prefix': this.props.prefix,
            'datasourceId': this.props.filterSourceType
        }, this.props.pageNumber, this.props.pageLimit, mappedColumnName, sortType))
        this.setState({
            columnNameClicked: mappedColumnName,
            sortOrder: this.state.sortOrder === 'ascending' ? 'descending' : 'ascending'
        })
    }

    render() {

        let tableHeaders = this.state.columnHeaders.map(headerName => {
            let mappedColumnName = this.state.columnHeaderDataNameMap[headerName]
            return (
                <Table.HeaderCell key={headerName}
                    sorted={this.state.columnNameClicked === mappedColumnName ? this.state.sortOrder : null}
                    onClick={() => this.handleColumnSort(mappedColumnName)} >
                    {headerName}
                </Table.HeaderCell>
            )
        })

        let tableRowData = null
        let resourceData = null
        let dsMap = this.props.datasourcesMap;
        let sourceFilterOptions = [{ "text": "All", "value": "" }];
        for (var index = 0; index < this.props.datasources.length; index++) {
            sourceFilterOptions.push({ "text": this.props.datasources[index].datasource_type, "value": this.props.datasources[index].datasource_id });
        }
        if (this.props.resourceSearchPayload)
            resourceData = this.props.resourceSearchPayload
        else if (this.props.resourceTree)
            resourceData = this.props.resourceTree

        if (resourceData)
            tableRowData = resourceData.map(rowData => {
                var dsImage = null;
                if (rowData.datasource_id) {
                    dsImage = <Image inline size='mini' src={dsMap[rowData.datasource_id] && dsMap[rowData.datasource_id].logo} circular></Image>
                }
                return (
                    <Table.Row key={rowData['resource_id']} onClick={(event) => this.handleClick(event, rowData)} style={this.props.rowData === rowData ? { 'backgroundColor': '#2185d0' } : null}>
                        <Table.Cell textAlign='center' >{dsImage}</Table.Cell>
                        <Table.Cell width='3' style={{ 'wordBreak': 'break-all' }}>{rowData["resource_name"]}</Table.Cell>
                        <Table.Cell width='3'>{rowData["resource_type"]}</Table.Cell>
                        <Table.Cell width='3'>{rowData["resource_owner_id"]}</Table.Cell>
                        <Table.Cell textAlign='center' width='3'>{rowData["exposure_type"]}</Table.Cell>
                        <Table.Cell width='3'>{rowData["parent_name"]}</Table.Cell>
                        <Table.Cell width='3'><IntlProvider locale='en'><FormattedRelative value={rowData["last_modified_time"]} /></IntlProvider ></Table.Cell>
                    </Table.Row>
                )
            })

        let dimmer = (
            <Dimmer active inverted>
                <Loader inverted content='Loading' />
            </Dimmer>
        )

        if (this.props.isLoadingResources || resourceData) {
            let ownerEmailId = this.props.selectedUser ? this.props.selectedUser.email : ''
            let filterMetadata = { 'exposureType': this.props.filterExposureType, 'resourceType': this.props.filterResourceType,  'ownerEmailId': ownerEmailId, 'parentFolder': this.props.filterParentFolder, 'selectedDate': this.props.filterByDate, 'resourceName': this.props.prefix !== undefined ? this.props.prefix : '', 'datasourceId': this.props.filterSourceType, 'logged_in_user': this.props.currentUser['email'] }
            return (
                <div>
                    <div ref="table" style={{ 'minHeight': document.body.clientHeight / 1.25, 'maxHeight': document.body.clientHeight / 1.25, 'overflow': 'auto', 'cursor': 'pointer' }}>
                        <Table celled selectable striped compact='very' sortable>
                            <Table.Header style={{ 'position': 'sticky', 'top': '50px', 'width': '100%' }}>
                                <Table.Row>
                                    {tableHeaders}
                                </Table.Row>
                            </Table.Header>
                            <Table.Body>
                                <Table.Row>
                                    <Table.Cell width='2'>
                                        <Dropdown
                                            fluid
                                            options={sourceFilterOptions}
                                            selection
                                            value={this.props.filterSourceType === '' ? 'ALL' : this.props.filterSourceType}
                                            onChange={this.handleSourceTypeChange}
                                        />
                                    </Table.Cell>
                                    <Table.Cell width='3'>
                                        <ResourceSearch filterMetadata={filterMetadata} />
                                    </Table.Cell>
                                    <Table.Cell width='2'>
                                        <Input fluid placeholder='Filter by type...' icon={this.state.filterResourceType.length > 0 ? <Icon name='close' link onClick={() => this.clearFilterData('filterResourceType')} /> : false} value={this.state.filterResourceType} onChange={this.handleResourceTypeChange} onKeyPress={(event) => this.handleKeyPress(event, "filterResourceType", this.state.filterResourceType)} />
                                    </Table.Cell>
                                    <Table.Cell width='3'>
                                        <GroupSearch />
                                    </Table.Cell>
                                    <Table.Cell width='3'>
                                        <Dropdown
                                            fluid
                                            options={this.exposureFilterOptions}
                                            selection
                                            value={this.props.filterExposureType === '' ? 'ALL' : this.props.filterExposureType}
                                            onChange={this.handleExposureTypeChange}
                                        />
                                    </Table.Cell>
                                    <Table.Cell width='3'>
                                        <Input fluid placeholder='Filter by folder...' icon={this.state.filterParentFolder.length > 0 ? <Icon name='close' link onClick={() => this.clearFilterData('filterParentFolder')} /> : false} value={this.state.filterParentFolder} onChange={this.handleParentFolderChange} onKeyPress={(event) => this.handleKeyPress(event, "filterParentFolder", this.state.filterParentFolder)} />
                                    </Table.Cell>
                                    <Table.Cell width='3'>
                                        <Input fluid placeholder='Filter by Date...'>
                                            <DatePicker
                                                selected={this.state.currentDate}
                                                onChange={this.handleDateChange}
                                                dateFormat="LLL"
                                            />
                                        </Input>
                                    </Table.Cell>
                                </Table.Row>
                                {tableRowData}
                            </Table.Body>
                        </Table>
                        {this.props.isLoadingResources ? dimmer : null}
                    </div>
                    <div style={{ marginTop: '10px' }} >
                        <div style={{float: 'right'}}>
                            {this.props.pageNumber > 0 ? (<Button color='green' size="mini" style={{ width: '80px' }} onClick={this.handlePreviousClick} >Previous</Button>) : null}
                            {(!tableRowData || tableRowData.length < this.props.pageLimit) ? null : (<Button color='green' size="mini" style={{ width: '80px' }} onClick={this.handleNextClick} >Next</Button>)}
                        </div>
                        <ExportCsvModal isResourceView={true} columnHeaders={this.state.columnHeaderDataNameMap} apiFunction={agent.Resources.exportToCsv} filterMetadata={filterMetadata} />
                    </div>
                </div>
            )
        }
        else
            return (
                <div style={{ textAlign: 'center' }}>
                    No Resources to display for user
                </div>
            )
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(ResourcesListTable);
