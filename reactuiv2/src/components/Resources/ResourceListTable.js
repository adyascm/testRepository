import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Loader, Dimmer, Button, Table, Dropdown, Input, Icon, Sticky, Image, Checkbox } from 'semantic-ui-react';

import agent from '../../utils/agent';
import { IntlProvider, FormattedRelative } from 'react-intl';
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import ResourceSearch from '../Search/ResourceSearch'
import GroupSearch from '../Search/GroupSearch';
import ExportCsvModal from '../ExportCsvModal'
import ActionsMenuBar from '../ActionsMenuBar'

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
                "SelectAll",
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
            sortOrder: undefined,
            selectAllColumns:false,
            selectedRowFields:{},
            showActionBar:false
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
        this.props.onLoad(agent.Resources.getResources({ 'accessibleBy': "", 'exposureType': this.props.filterExposureType, 'resourceType': this.props.filterResourceType, 'pageNumber': this.props.pageNumber, 'pageSize': this.props.pageLimit, 'sourceType': this.props.filterSourceType }))
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
                let ownerEmailId = nextProps.selectedUser ? nextProps.selectedUser.email : ''
                nextProps.onLoadStart()
                nextProps.onLoad(agent.Resources.getResources({ 'accessibleBy': "", 'exposureType': nextProps.filterExposureType, 'resourceType': nextProps.filterResourceType, 'pageNumber': nextProps.pageNumber, 'pageSize': nextProps.pageLimit, 'ownerEmailId': ownerEmailId, 'parentFolder': nextProps.filterParentFolder, 'selectedDate': nextProps.filterByDate, 'prefix': nextProps.prefix, 'sortColumn': this.state.columnNameClicked, 'sortType': this.state.sortOrder === 'ascending' ? 'asc' : 'desc', 'sourceType': nextProps.filterSourceType }))
                this.disableAllRowsChecked()
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
        this.disableAllRowsChecked()
        event.preventDefault()
        this.props.setRowData(rowData)
    }

    handleExposureTypeChange = (event, data) => {
        this.disableAllRowsChecked()
        let value = data.value === 'ALL' ? '' : data.value
        if (value !== this.props.filterExposureType)
            this.props.changeFilter("filterExposureType", value);
    }

    handleResourceTypeChange = (event) => {
        this.disableAllRowsChecked()
        this.setState({
            filterResourceType: event.target.value
        });
    }

    handleParentFolderChange = (event) => {
        this.disableAllRowsChecked()
        this.setState({
            filterParentFolder: event.target.value
        })
    }

    handleSourceTypeChange = (event, data) => {
        this.disableAllRowsChecked()
        this.props.changeFilter("filterSourceType", data.value)
    }

    handleDateChange = (date) => {
        this.disableAllRowsChecked()
        let selectedDate = date ? date.format('YYYY-MM-DD HH:MM:SS') : ''
        this.setState({
            currentDate: date ? date : ''
        })
        this.props.changeFilter("filterByDate", selectedDate)
    }

    handleKeyPress = (event, filterType, filterValue) => {
        this.disableAllRowsChecked()
        if (event.key === 'Enter') {
            this.props.changeFilter(filterType, filterValue);
        }
    }

    handleNextClick = () => {
        this.disableAllRowsChecked()
        this.props.setPaginationData(this.props.pageNumber + 1, this.props.pageLimit)
    }

    handlePreviousClick = () => {
        this.disableAllRowsChecked()
        this.props.setPaginationData(this.props.pageNumber - 1, this.props.pageLimit)
    }

    clearFilterData = (stateKey) => {
        this.disableAllRowsChecked()
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
        this.disableAllRowsChecked()
        let ownerEmailId = this.props.selectedUser ? this.props.selectedUser.email : ''
        if (this.state.columnNameClicked !== mappedColumnName) {
            this.props.onLoadStart()

            this.props.onLoad(agent.Resources.getResources({
                'accessibleBy': "", 'exposureType': this.props.filterExposureType, 'resourceType': this.props.filterResourceType, 'pageNumber': this.props.pageNumber, 'pageSize': this.props.pageLimit, 'ownerEmailId': ownerEmailId, 'parentFolder': this.props.filterParentFolder, 'selectedDate': this.props.filterByDate, 'prefix': this.props.prefix,
                'sortColumn': mappedColumnName, 'sortType': 'asc', 'sourceType': this.props.filterSourceType
            }))
            this.setState({
                columnNameClicked: mappedColumnName,
                sortOrder: 'ascending'
            })
        }
        else {
            this.props.onLoadStart()

            this.props.onLoad(agent.Resources.getResources({
                'accessibleBy': "", 'exposureType': this.props.filterExposureType, 'resourceType': this.props.filterResourceType, 'pageNumber': this.props.pageNumber, 'pageSize': this.props.pageLimit, 'ownerEmailId': ownerEmailId, 'parentFolder': this.props.filterParentFolder, 'selectedDate': this.props.filterByDate, 'prefix': this.props.prefix,
                'sortColumn': mappedColumnName, 'sortType': this.state.sortOrder === 'ascending' ? 'desc' : 'asc', 'sourceType': this.props.filterSourceType
            }))
            this.setState({
                sortOrder: this.state.sortOrder === 'ascending' ? 'descending' : 'ascending'
            })
        }
    }

    disableAllRowsChecked = () => {
        this.setState({
            selectedRowFields : {},
            selectAllColumns:false,
            showActionBar:false
        })
    }

    handleAllRowsChecked = (event, data) => {
        let selectAllColumns = !this.state.selectAllColumns
        let selectedRowFields = this.state.selectedRowFields
        for(var i in this.props.resourceTree){
            selectedRowFields[i] = selectAllColumns
        }    
        this.setState({
            selectAllColumns: selectAllColumns,
            selectedRowFields:selectedRowFields,
            showActionBar:selectAllColumns
        })
    }

    handleRowChecked = (event, data, index) => {
        event.stopPropagation()
        let selectedRowFields = this.state.selectedRowFields
        selectedRowFields[index] = index in selectedRowFields ? !selectedRowFields[index] : true
        let showActionBar = Object.values(selectedRowFields).some(item => { return item;})
        this.setState({
            selectedRowFields:selectedRowFields,
            showActionBar:showActionBar
        })
        if (!selectedRowFields[index]) {
            this.setState({
                selectAllColumns: false
            })
        }
    }

    render() {

        

        let tableHeaders = this.state.columnHeaders.map(headerName => {
            let mappedColumnName = this.state.columnHeaderDataNameMap[headerName]
            if(headerName == 'SelectAll'){
                return (
                    <Table.HeaderCell key={headerName}>
                        <Checkbox onChange={this.handleAllRowsChecked} checked={this.state.selectAllColumns} />
                    </Table.HeaderCell>
                )
            }else{
                return (
                    <Table.HeaderCell key={headerName}
                        sorted={this.state.columnNameClicked === mappedColumnName ? this.state.sortOrder : null}
                        onClick={() => this.handleColumnSort(mappedColumnName)} >
                        {headerName}
                    </Table.HeaderCell>
                )
            }
            
        })

        let tableRowData = null
        let resourceData = null
        let dsMap = this.props.datasourcesMap;
        let sourceFilterOptions = [{ "text": "All", "value": "" }];
        let gsuiteOptns = [{'actionKey':'change_owner_of_multiple_files','actionText':'Transfer Ownership'},{'actionKey':'remove_external_access_to_mutiple_resources','actionText':'Remove external sharing'},
        {'actionKey':'make_multiple_resources_private','actionText':'Remove all sharing'}]
        for (var index = 0; index < this.props.datasources.length; index++) {
            sourceFilterOptions.push({ "text": this.props.datasources[index].datasource_type, "value": this.props.datasources[index].datasource_id });
        }
        if (this.props.resourceSearchPayload)
            resourceData = this.props.resourceSearchPayload
        else if (this.props.resourceTree)
            resourceData = this.props.resourceTree

        if (resourceData)
            tableRowData = resourceData.map((rowData,index) => {
                var dsImage = null;
                if (rowData.datasource_id) {
                    dsImage = <Image inline size='mini' src={dsMap[rowData.datasource_id] && dsMap[rowData.datasource_id].logo} circular></Image>
                }
                return (
                    <Table.Row key={rowData['resource_id']} onClick={(event) => this.handleClick(event, rowData)} style={this.props.rowData === rowData ? { 'backgroundColor': '#2185d0' } : null}>
                        <Table.Cell onClick={(event) => {event.stopPropagation()}}>
                            <Checkbox onChange={(event, data) => this.handleRowChecked(event, data, index)} checked={this.state.selectedRowFields[index]} />
                        </Table.Cell>
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
            let filterMetadata = { 'accessibleBy': "", 'exposureType': this.props.filterExposureType, 'resourceType': this.props.filterResourceType,  'ownerEmailId': ownerEmailId, 'parentFolder': this.props.filterParentFolder, 'selectedDate': this.props.filterByDate, 'resourceName': this.props.prefix !== undefined ? this.props.prefix : '', 'sourceType': this.props.filterSourceType, 'logged_in_user': this.props.currentUser['email'] }

            return (
                <div>
                    <ActionsMenuBar selectedRowFields={this.state.selectedRowFields}  disableAllRowsChecked={this.disableAllRowsChecked} entityList={resourceData} viewType={'RESOURCES'} gsuiteOptns={gsuiteOptns} showActionBar={this.state.showActionBar} columnHeaderDataNameMap={this.state.columnHeaderDataNameMap} filterMetadata={filterMetadata}  />
                    <div style={{float: 'right', marginTop: '0.7rem'}}>
                            {this.props.pageNumber > 0 ? (<Button color='green' size="mini" style={{ width: '80px' }} onClick={this.handlePreviousClick} >Previous</Button>) : null}
                            {(!tableRowData || tableRowData.length < this.props.pageLimit) ? null : (<Button color='green' size="mini" style={{ width: '80px' }} onClick={this.handleNextClick} >Next</Button>)}
                    </div>
                    <div ref="table" style={{ 'minHeight': document.body.clientHeight / 1.25, 'maxHeight': document.body.clientHeight / 1.25, 'overflow': 'auto', 'cursor': 'pointer', 'marginTop':'50px' }}>
                        <Table celled selectable striped compact='very' sortable>
                            <Table.Header style={{'width': '100%' }}>
                                <Table.Row>
                                    {tableHeaders}
                                </Table.Row>
                            </Table.Header>
                            <Table.Body>
                                <Table.Row>
                                    <Table.Cell>
                                    </Table.Cell>
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
