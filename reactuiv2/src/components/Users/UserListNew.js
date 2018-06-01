import React, { Component } from 'react';
import { connect } from 'react-redux';

import { Loader, Dimmer, Button, Table, Dropdown, Input, Icon, Sticky, Image, Label, Grid } from 'semantic-ui-react';
import UserStats from "./UserStats";
import agent from '../../utils/agent';

import {
    USER_ITEM_SELECTED,
    USERS_PAGE_LOAD_START,
    USERS_LIST_PAGE_LOADED,
    USERS_DOMAIN_STATS_LOADED,
    USERS_FILTER_CHANGE
} from '../../constants/actionTypes';


const mapStateToProps = state => ({
    ...state.users,
    ...state.common
});

const mapDispatchToProps = dispatch => ({
    onLoadStart: () => dispatch({ type: USERS_PAGE_LOAD_START }),
    onLoad: (payload) => dispatch({ type: USERS_LIST_PAGE_LOADED, payload }),
    onLoadDomainStats: (payload) => dispatch({ type: USERS_DOMAIN_STATS_LOADED, payload }),
    selectUserItem: (payload) =>
        dispatch({ type: USER_ITEM_SELECTED, payload }),
    changeFilter: (filterName, filterValue) => 
        dispatch({ type: USERS_FILTER_CHANGE, filterName, filterValue })
});


class UserListNew extends Component {
    constructor(props) {
        super(props);
        this.state = {
            columnHeaders: [
                "Source",
                "Name",
                "Email",
                "",
                "Is Admin",
                "Type"
            ],
            columnHeaderDataNameMap: {
                "Source": "datasource_id",
                "Name": "user_name",
                "Email": "user_email",
                "Avatar": "",
                "Type": "user_type",
                "Is Admin": "is_admin",
            },
            columnNameClicked: undefined,
            sortOrder: undefined,
            nameColumnFilterValue: this.props.nameColumnFilterValue,
            emailColumnFilterValue: this.props.emailColumnFilterValue,
            typeColumnFilterValue: this.props.typeColumnFilterValue,
            sourceColumnFilterValue: this.props.sourceColumnFilterValue
        }

        this.exposureFilterOptions = [
            {
                text: 'All',
                value: 'ALL'
            },
            {
                text: 'External',
                value: 'EXT'
            },
            {
                text: 'Internal',
                value: 'INT'
            },
            {
                text: 'Trusted',
                value: 'TRUST'
            }
        ]

        this.exposureFilterMap = {
            "All": '',
            "External": 'EXT',
            "Internal": 'INT',
            "Trusted": 'TRUST'
        }
    }
    componentWillMount() {
        this.props.onLoadStart()
        this.props.onLoad(agent.Users.getUsersList(this.props.nameColumnFilterValue, this.props.emailColumnFilterValue, this.props.typeColumnFilterValue, this.props.sourceColumnFilterValue, '', '', ''))
        this.props.onLoadDomainStats(agent.Users.getUserStats());
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.nameColumnFilterValue !== this.props.nameColumnFilterValue || nextProps.emailColumnFilterValue !== this.props.emailColumnFilterValue ||
            nextProps.typeColumnFilterValue !== this.props.typeColumnFilterValue || nextProps.sourceColumnFilterValue !== this.props.sourceColumnFilterValue) {
            this.props.onLoadStart()
            this.props.onLoad(agent.Users.getUsersList(nextProps.nameColumnFilterValue, nextProps.emailColumnFilterValue, nextProps.typeColumnFilterValue, nextProps.sourceColumnFilterValue, '', '', ''))
        }
    }

    handleRowClick = (event, rowData) => {
        this.props.selectUserItem(rowData)
    }

    handleColumnFilterChange = (event, data, filterType) => {
        //this.props.changeFilter(filterType, data.value)
        if (filterType === 'typeColumnFilterValue') {
            if (data.value === 'ALL')
                this.props.changeFilter(filterType, '')
            else
                this.props.changeFilter(filterType, data.value)
            this.setState({
                typeColumnFilterValue: data.value
            })
        }
        else 
            this.props.changeFilter(filterType, data.value)
    }

    clearFilter = (event, filterType) => {
        this.props.changeFilter(filterType, '');
    }

    handleColumnSort = (mappedColumnName) => {
        if (this.state.columnNameClicked !== mappedColumnName) {
            this.props.onLoadStart()
            this.props.onLoad(agent.Users.getUsersList(this.props.nameColumnFilterValue, this.props.emailColumnFilterValue, this.props.typeColumnFilterValue, this.props.sourceColumnFilterValue, mappedColumnName, 'asc', ''))
            this.setState({
                columnNameClicked: mappedColumnName,
                sortOrder: 'ascending'
            })
        }
        else {
            this.props.onLoadStart()
            this.props.onLoad(agent.Users.getUsersList(this.props.nameColumnFilterValue, this.props.emailColumnFilterValue, this.props.typeColumnFilterValue, this.props.sourceColumnFilterValue, mappedColumnName, this.state.sortOrder === 'ascending' ? 'desc' : 'asc', ''))
            this.setState({
                sortOrder: this.state.sortOrder === 'ascending' ? 'descending' : 'ascending'
            })
        }
    }

    handleStatsClick = (event, statType, statSubType) => {
        if (statType === "Access") {
            this.props.changeFilter("typeColumnFilterValue", this.exposureFilterMap[statSubType])
            this.setState({
                typeColumnFilterValue: this.exposureFilterMap[statSubType]
            })
        }
        else if (statType === "Domains") {
            this.props.onLoadStart()
            this.props.onLoad(agent.Users.getUsersList(this.props.nameColumnFilterValue, statSubType, '', this.props.sourceColumnFilterValue, '', '', ''))
            this.setState({
                typeColumnFilterValue: ''
            })
        }
        else if (statType === "Privileges") {
            this.props.onLoadStart()
            this.props.onLoad(agent.Users.getUsersList(this.props.nameColumnFilterValue, this.props.emailColumnFilterValue, '', this.props.sourceColumnFilterValue, '', '', statSubType))
            this.setState({
                typeColumnFilterValue: ''
            })
        }
        
    }

    render() {

        let datasourceFilterOptions = [{text:"All", value:""}];
        for (var index in this.props.datasources) {
            let ds = this.props.datasources[index];
            datasourceFilterOptions.push({text:ds.datasource_type, value:ds.datasource_id});
          }
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

        let tableRowData = null;
        let usersData = this.props.usersList;
        let dsMap = this.props.datasourcesMap;
        if (usersData)
            tableRowData = usersData.map(rowData => {
                var avatarImage = null;
                if(!rowData.full_name)
                    rowData.full_name = rowData.first_name + " " + (rowData.last_name || "")
                if (rowData.photo_url) {
                    avatarImage = <Image inline size='mini' src={rowData.photo_url} circular></Image>
                } else {
                    avatarImage = <Image size='tiny' ><Label style={{ fontSize: '1.5rem' }} circular >{rowData.first_name.charAt(0).toUpperCase()}</Label></Image>
                }
                var dsImage = null;
                if (rowData.datasource_id) {
                    dsImage = <Image inline size='mini' src={dsMap[rowData.datasource_id] && dsMap[rowData.datasource_id].logo} circular></Image>
                }
                
                return (
                    <Table.Row onClick={(event) => this.handleRowClick(event, rowData)} style={this.props.selectedUserItem === rowData ? { 'backgroundColor': '#2185d0' } : null}>
                        <Table.Cell textAlign="center">{dsImage}</Table.Cell>
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
                    <Grid.Row fluid>
                        <Grid.Column width={3}>
                            <UserStats userStats={this.props.userStats} isUserSelected={this.props.selectedUserItem} handleStatsClick={this.handleStatsClick} />
                        </Grid.Column>
                        <Grid.Column width={13}>
                            <div ref="table" style={{ 'minHeight': document.body.clientHeight/1.25, 'maxHeight': document.body.clientHeight/1.25, 'overflow': 'auto', 'cursor': 'pointer' }}>
                                <Table celled selectable striped compact='very' sortable>
                                    <Table.Header style={{ 'position': 'sticky', 'top': '50px', 'width': '100%' }}>
                                        <Table.Row>
                                            {tableHeaders}
                                        </Table.Row>
                                    </Table.Header>
                                    <Table.Body>
                                        <Table.Row>
                                        <Table.Cell >
                                                <Dropdown
                                                    fluid
                                                    options={datasourceFilterOptions}
                                                    selection
                                                    value={this.props.sourceColumnFilterValue}
                                                    onChange={(event, data) => this.handleColumnFilterChange(event, data, "sourceColumnFilterValue")}
                                                />
                                            </Table.Cell>
                                            
                                            <Table.Cell width='4'>
                                                <Input fluid placeholder="Filter by name..." icon={this.props.nameColumnFilterValue.length ? <Icon name='close' link onClick={(event) => this.clearFilter(event,'nameColumnFilterValue')} /> : null} value={this.props.nameColumnFilterValue} onChange={(event, data) => this.handleColumnFilterChange(event, data, "nameColumnFilterValue")}/>
                                            </Table.Cell>
                                            <Table.Cell width='4'>
                                                <Input fluid placeholder="Filter by email..." icon={this.props.emailColumnFilterValue.length ? <Icon name='close' link onClick={(event) => this.clearFilter(event, 'emailColumnFilterValue')} /> : null} value={this.props.emailColumnFilterValue} onChange={(event, data) => this.handleColumnFilterChange(event, data, "emailColumnFilterValue")} />
                                            </Table.Cell>
                                            <Table.Cell width='1'></Table.Cell>
                                            <Table.Cell width='1'></Table.Cell>
                                            <Table.Cell width='3'>
                                                <Dropdown
                                                    fluid
                                                    options={this.exposureFilterOptions}
                                                    selection
                                                    value={this.state.typeColumnFilterValue}
                                                    onChange={(event, data) => this.handleColumnFilterChange(event, data, "typeColumnFilterValue")}
                                                />
                                            </Table.Cell>
                                        </Table.Row>
                                        {tableRowData}
                                    </Table.Body>
                                </Table>
                                {this.props.isLoadingUsers ? dimmer : null}
                            </div>
                            <div style={{ marginTop: '5px' }} >
                                {(!tableRowData || tableRowData.length < this.props.pageLimit) ? null : (<Button color='green' size="mini" style={{ float: 'right', width: '80px' }} onClick={this.handleNextClick} >Next</Button>)}
                                {this.props.pageNumber > 0 ? (<Button color='green' size="mini" style={{ float: 'right', width: '80px' }} onClick={this.handlePreviousClick} >Previous</Button>) : null}
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
