import React, { Component } from 'react';
import { connect } from 'react-redux';

import { Loader, Dimmer, Button, Table, Container, Input, Icon, Image, Label, Grid } from 'semantic-ui-react';
import UserStats from "./UserStats";
import agent from '../../utils/agent';

import {
    USER_ITEM_SELECTED,
    USERS_PAGE_LOAD_START,
    USERS_LIST_PAGE_LOADED,
    USERS_DOMAIN_STATS_LOADED,
    USERS_FILTER_CHANGE,
    USERS_LIST_PAGINATION_DATA,
    USERS_STATS_UDPATE,
    USERS_COLUMN_SORT
} from '../../constants/actionTypes';


const mapStateToProps = state => ({
    ...state.users,
    ...state.common
});

const mapDispatchToProps = dispatch => ({
    onLoadStart: () => dispatch({ type: USERS_PAGE_LOAD_START }),
    onLoad: (searchKeyword, payload) => dispatch({ type: USERS_LIST_PAGE_LOADED, searchKeyword: searchKeyword, payload: payload }),
    onLoadDomainStats: (payload) => dispatch({ type: USERS_DOMAIN_STATS_LOADED, payload }),
    selectUserItem: (payload) =>
        dispatch({ type: USER_ITEM_SELECTED, payload }),
    changeFilter: (filterName, filterText, filterValue) =>
        dispatch({ type: USERS_FILTER_CHANGE, filterName, filterText, filterValue }),
    setNextPageNumber: (pageNumber) =>
        dispatch({ type: USERS_LIST_PAGINATION_DATA, pageNumber }),
    setSortColumnField: (columnName, sortType) =>
        dispatch({ type: USERS_COLUMN_SORT, columnName, sortType })
});


class UserListNew extends Component {
    constructor(props) {
        super(props);
        this.state = {
            columnHeaders: [
                "Source",
                "Type",
                "Name",
                "Email",
                "Avatar",
                "Is Admin",
                "Type"
            ],
            columnHeaderDataNameMap: {
                "Source": "datasource_id",
                "Name": "full_name",
                "Email": "email",
                "Avatar": "",
                "Type": "type",
                "Is Admin": "is_admin",
            },
            columnNameClicked: this.props.sortColumnName,
            sortOrder: this.props.sortType,
            numberAppliedFilter: this.props.listFilters ? Object.keys(this.props.listFilters).length : 0
        }

        this.exposureFilterMap = {
            "All": '',
            "External": 'EXT',
            "Internal": 'INT',
            "Trusted": 'TRUST'
        }
    }
    componentWillMount() {
        this.props.onLoadStart()
        let emailFilter = this.props.listFilters.email ? this.props.listFilters.email.value || "" : "";
        this.props.onLoad(emailFilter, agent.Users.getUsersList(this.props.listFilters.full_name ? this.props.listFilters.full_name.value || "" : "",
            emailFilter,
            this.props.listFilters.member_type ? this.props.listFilters.member_type.value || "" : "",
            this.props.listFilters.datasource_id ? this.props.listFilters.datasource_id.value || "" : "",
            this.props.listFilters.is_admin ? this.props.listFilters.is_admin.value || "" : "",
            this.props.listFilters.type ? this.props.listFilters.type.value || "" : "",
            this.props.sortColumnName || "", this.state.sortType || "desc", this.props.usersListPageNumber || 0))
        this.props.onLoadDomainStats(agent.Users.getUserStats());
    }

    componentWillReceiveProps(nextProps) {
        let numberAppliedFilter = nextProps.listFilters ? Object.keys(nextProps.listFilters).length : 0
        if (this.props.listFilters !== nextProps.listFilters || this.props.sortColumnName != nextProps.sortColumnName || this.props.sortType != nextProps.sortType ||
            nextProps.usersListPageNumber !== this.props.usersListPageNumber) {
            this.props.onLoadStart();
            let emailFilter = nextProps.listFilters.email ? nextProps.listFilters.email.value || "" : "";
            this.props.onLoad(emailFilter, agent.Users.getUsersList(nextProps.listFilters.full_name ? nextProps.listFilters.full_name.value || "" : "",
                emailFilter,
                nextProps.listFilters.member_type ? nextProps.listFilters.member_type.value || "" : "",
                nextProps.listFilters.datasource_id ? nextProps.listFilters.datasource_id.value || "" : "",
                nextProps.listFilters.is_admin ? nextProps.listFilters.is_admin.value : "",
                nextProps.listFilters.type ? nextProps.listFilters.type.value || "" : "",
                nextProps.sortColumnName || "", nextProps.sortType || "desc", nextProps.usersListPageNumber || 0))

            this.setState({
                numberAppliedFilter: numberAppliedFilter
            })
        }
    }

    handleRowClick = (event, rowData) => {
        this.props.selectUserItem(rowData)
    }

    handleColumnFilterChange = (event, data, filterType) => {
        this.props.changeFilter(filterType, data.value, data.value)
    }

    clearFilter = (event, filterType) => {
        event.stopPropagation()
        this.props.changeFilter(filterType, '', '');
    }

    handleColumnSort = (event, mappedColumnName) => {
        event.stopPropagation()
        if (this.state.columnNameClicked !== mappedColumnName) {
            this.props.setSortColumnField(mappedColumnName, 'asc')
            this.setState({
                columnNameClicked: mappedColumnName,
                sortOrder: 'ascending'
            })
        }
        else {
            this.props.setSortColumnField(mappedColumnName, this.state.sortOrder === 'ascending' ? 'desc' : 'asc')
            this.setState({
                sortOrder: this.state.sortOrder === 'ascending' ? 'descending' : 'ascending'
            })
        }
    }

    handleStatsClick = (event, statType, statSubTypeDisplay, statSubTypeValue) => {
        this.props.changeFilter(statType, statSubTypeDisplay, statSubTypeValue)
    }

    handleNextClick = () => {
        this.props.setNextPageNumber(this.props.usersListPageNumber + 1)
    }

    handlePreviousClick = () => {
        this.props.setNextPageNumber(this.props.usersListPageNumber - 1)
    }

    handleClick = (event) => {
        event.stopPropagation()
    }

    render() {

        let datasourceFilterOptions = [{ text: "All", value: 'ALL' }];
        for (var index in this.props.datasources) {
            let ds = this.props.datasources[index];
            datasourceFilterOptions.push({ text: ds.datasource_type, value: ds.datasource_id });
        }
        let tableHeaders = this.state.columnHeaders.map(headerName => {
            let mappedColumnName = this.state.columnHeaderDataNameMap[headerName]
            return (
                <Table.HeaderCell key={headerName}
                    sorted={this.state.columnNameClicked === mappedColumnName ? this.state.sortOrder : null}
                    onClick={(event) => this.handleColumnSort(event, mappedColumnName)}
                >
                    {headerName === "Email" ? <Input style={{ 'width': '20rem' }} icon={this.props.listFilters.email && this.props.listFilters.email.value ? <Icon name='close' link onClick={(event) => this.clearFilter(event, "email")} /> : null} placeholder="Filter by email ..."
                        value={this.props.listFilters.email ? this.props.listFilters.email.value : ""} onClick={(event) => this.handleClick(event)} onChange={(event, data) => this.handleColumnFilterChange(event, data, "email")} /> : headerName}
                </Table.HeaderCell>
            )
        })
        let filterSelections = [];
        if (this.state.numberAppliedFilter) {
            var filterKeys = Object.keys(this.props.listFilters)
            for (let index = 0; index < filterKeys.length; index++) {
                filterSelections.push(<Label key={index} color='blue'>
                    {this.props.listFilters[filterKeys[index]].text}
                    <Icon name='close' onClick={(event) => this.clearFilter(event, filterKeys[index])} />
                </Label>);
            }
        }
        let tableRowData = null;
        let usersData = this.props.usersList;
        let dsMap = this.props.datasourcesMap;
        if (usersData)
            tableRowData = usersData.map(rowData => {
                var avatarImage = null;
                if (!rowData.full_name)
                    rowData.full_name = rowData.first_name + " " + (rowData.last_name || "")
                if (rowData.photo_url) {
                    avatarImage = <Image inline size='mini' src={rowData.photo_url} circular></Image>
                } else {
                    avatarImage = <Image size='mini' ><Label style={{ fontSize: '1.2rem' }} circular >{rowData.full_name.charAt(0).toUpperCase()}</Label></Image>
                }
                var dsImage = null;
                if (rowData.datasource_id) {
                    dsImage = <Image inline size='mini' src={dsMap[rowData.datasource_id] && dsMap[rowData.datasource_id].logo} circular></Image>
                }

                return (
                    <Table.Row onClick={(event) => this.handleRowClick(event, rowData)} style={this.props.selectedUserItem === rowData ? { 'backgroundColor': '#2185d0' } : null}>
                        <Table.Cell textAlign="center">{dsImage}</Table.Cell>
                        <Table.Cell>{rowData["type"]}</Table.Cell>
                        <Table.Cell >{rowData["full_name"]}</Table.Cell>
                        <Table.Cell >{rowData["email"]}</Table.Cell>
                        <Table.Cell textAlign="center" >{avatarImage}</Table.Cell>
                        <Table.Cell textAlign="center">{rowData["is_admin"] ? <Icon name="checkmark" /> : null}</Table.Cell>
                        <Table.Cell textAlign="center">{rowData["member_type"]}</Table.Cell>
                    </Table.Row>
                )
            })

        let dimmer = (
            <Dimmer active inverted>
                <Loader inverted content='Loading' />
            </Dimmer>
        )

        if (this.props.isLoadingUsers || usersData) {
            return (
                <Grid fluid >
                    <Container fluid textAlign="left">
                        {filterSelections}
                    </Container>
                    <Grid.Row fluid>
                        <Grid.Column width={this.props.selectedUserItem ? 0 : 3}>
                            <UserStats userStats={this.props.userStats} isUserSelected={this.props.selectedUserItem} handleStatsClick={this.handleStatsClick} statSubType={this.props.userStatSubType} />
                        </Grid.Column>
                        <Grid.Column width={this.props.selectedUserItem ? 16 : 13}>
                            <div ref="table" style={{ 'minHeight': document.body.clientHeight / 1.25, 'maxHeight': document.body.clientHeight / 1.25, 'overflow': 'auto', 'cursor': 'pointer' }}>
                                <Table celled selectable striped compact='very' sortable>
                                    <Table.Header style={{ 'position': 'sticky', 'top': '50px', 'width': '100%' }}>
                                        <Table.Row>
                                            {tableHeaders}
                                        </Table.Row>
                                    </Table.Header>
                                    <Table.Body>
                                        {tableRowData}
                                    </Table.Body>
                                </Table>
                                {this.props.isLoadingUsers ? dimmer : null}
                            </div>
                            <div style={{ marginTop: '5px' }} >
                                {this.props.isLoadingUsers || (usersData && usersData.length < 50) ? null : (<Button color='green' size="mini" style={{ float: 'right', width: '80px' }} onClick={this.handleNextClick} >Next</Button>)}
                                {!this.props.isLoadingUsers && this.props.usersListPageNumber > 0 ? (<Button color='green' size="mini" style={{ float: 'right', width: '80px' }} onClick={this.handlePreviousClick} >Previous</Button>) : null}
                            </div>
                        </Grid.Column >
                    </Grid.Row>
                </Grid>
            )
        }
        else
            return (
                <div style={{ textAlign: 'center' }}>
                    No users to display
                </div>
            )
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(UserListNew);
