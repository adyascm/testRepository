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
                "",
                "Name",
                "Email",
                "Source",
                "Is Admin",
                "Type"
            ],
            columnHeaderDataNameMap: {
                "Avatar": "resource_name",
                "Name": "resource_type",
                "Email": "resource_owner_id",
                "Source": "datasource_id",
                "Type": "exposure_type",
                "Is Admin": "parent_name",
            },
            columnNameClicked: undefined,
            sortOrder: undefined,
            nameFilterValue: '',
            emailFilterValue: '',
            typeFilterValue: 'EXT'
        }

        this.exposureFilterOptions = [
            {
                text: 'External Users',
                value: 'EXT'
            },
            {
                text: 'Internal Users',
                value: 'INT'
            },
            {
                text: 'Trusted Domain Users',
                value: 'TRUST'
            },
            {
                text: 'All Users',
                value: ''
            }
        ]
    }
    componentWillMount() {
        this.props.onLoadStart()
        this.props.onLoad(agent.Users.getUsersList(this.props.filterUserName, this.props.filterUserEmail, this.props.filterUserType))
        this.props.onLoadDomainStats(agent.Users.getUserStats());
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.filterUserName !== this.props.filterUserName || nextProps.filterUserEmail !== this.props.filterUserEmail ||
            nextProps.filterUserType !== this.props.filterUserType) {
            this.props.onLoadStart()
            this.props.onLoad(agent.Users.getUsersList(nextProps.filterUserName, nextProps.filterUserEmail, nextProps.filterUserType))
        }
    }

    handleRowClick = (event, rowData) => {
        this.props.selectUserItem(rowData)
    }

    handleNameChange = (event, data) => {
        if (!data.value.length)
            this.props.changeFilter('filterUserName', '')
        this.setState({
            nameFilterValue: data.value
        })
    }

    handleEmailChange = (event, data) => {
        if (!data.value.length)
            this.props.changeFilter('filterUserEmail', '')
        this.setState({
            emailFilterValue: data.value
        })
    }

    handleTypeChange = (event, data) => {
        this.props.changeFilter('filterUserType', data.value)
        this.setState({
            typeFilterValue: data.value
        })
    }

    handleKeyPress = (event, filterType) => {
        if (event.key === 'Enter')
            this.props.changeFilter(filterType, event.target.value)
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

        let tableRowData = null;
        let usersData = this.props.usersList;
        let dsMap = this.props.datasourcesMap;
        if (usersData)
            tableRowData = usersData.map(rowData => {
                var avatarImage = null;
                rowData.full_name = rowData.first_name + " " + rowData.last_name
                if (rowData.photo_url) {
                    avatarImage = <Image inline floated='right' size='mini' src={rowData.photo_url} circular></Image>
                } else {
                    avatarImage = <Image floated='right' size='tiny' ><Label style={{ fontSize: '1.5rem' }} circular >{rowData.first_name.charAt(0).toUpperCase()}</Label></Image>
                }
                var dsImage = null;
                if (rowData.datasource_id) {
                    dsImage = <Image inline size='mini' src={dsMap[rowData.datasource_id] && dsMap[rowData.datasource_id].logo} circular></Image>
                }
                
                return (
                    <Table.Row onClick={(event) => this.handleRowClick(event, rowData)} style={this.props.selectedUserItem === rowData ? { 'backgroundColor': '#2185d0' } : null}>
                        <Table.Cell width='1'>{avatarImage}</Table.Cell>
                        <Table.Cell >{rowData["full_name"]}</Table.Cell>
                        <Table.Cell >{rowData["email"]}</Table.Cell>
                        <Table.Cell textAlign="center">{dsImage}</Table.Cell>
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
                            <UserStats userStats={this.props.userStats} isUserSelected={this.props.selectedUserItem}/>
                        </Grid.Column>
                        <Grid.Column width={13}>
                            <div ref="table" style={{ 'minHeight': usersData ? null : document.body.clientHeight / 2, 'maxHeight': document.body.clientHeight / 1.05, 'overflow': 'auto', 'cursor': 'pointer' }}>
                                <Table celled selectable striped compact='very' sortable>
                                    <Table.Header style={{ 'position': 'sticky', 'top': '50px', 'width': '100%' }}>
                                        <Table.Row>
                                            {tableHeaders}
                                        </Table.Row>
                                    </Table.Header>
                                    <Table.Body>
                                        <Table.Row>
                                            <Table.Cell width='1'></Table.Cell>
                                            <Table.Cell width='4'>
                                                <Input fluid placeholder="Filter by name..." value={this.state.nameFilterValue} onChange={this.handleNameChange} onKeyPress={(event) => this.handleKeyPress(event,'filterUserName')} />
                                            </Table.Cell>
                                            <Table.Cell width='4'>
                                                <Input fluid placeholder="Filter by email..." value={this.state.emailFilterValue} onChange={this.handleEmailChange} onKeyPress={(event) => this.handleKeyPress(event,'filterUserEmail')} />
                                            </Table.Cell>
                                            <Table.Cell width='1'></Table.Cell>
                                            <Table.Cell width='1'></Table.Cell>
                                            <Table.Cell width='3'>
                                                <Dropdown
                                                    fluid
                                                    options={this.exposureFilterOptions}
                                                    selection
                                                    value={this.state.typeFilterValue}
                                                    onChange={this.handleTypeChange}
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