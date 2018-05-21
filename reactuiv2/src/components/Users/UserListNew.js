import React, { Component } from 'react';
import { connect } from 'react-redux';

import { Loader, Dimmer, Button, Table, Dropdown, Input, Icon, Sticky, Image, Label } from 'semantic-ui-react';
import agent from '../../utils/agent';

import {
    USER_ITEM_SELECTED,
    USERS_PAGE_LOAD_START,
    USERS_LIST_PAGE_LOADED
} from '../../constants/actionTypes';


const mapStateToProps = state => ({
    ...state.users,
    ...state.common
});

const mapDispatchToProps = dispatch => ({
    onLoadStart: () => dispatch({ type: USERS_PAGE_LOAD_START }),
    onLoad: (payload) => dispatch({ type: USERS_LIST_PAGE_LOADED, payload }),
    selectUserItem: (payload) =>
        dispatch({ type: USER_ITEM_SELECTED, payload })
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
            sortOrder: undefined
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
        this.props.onLoad(agent.Users.getUsersList())
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
            if (rowData.photo_url) {
                avatarImage = <Image inline floated='right' size='mini' src={rowData.photo_url} circular></Image>
            } else {
                avatarImage = <Image floated='right' size='tiny' ><Label style={{ fontSize: '1.5rem' }} circular >{rowData.first_name.charAt(0)}</Label></Image>
            }
            var dsImage = null;
            if (rowData.datasource_id) {
                dsImage = <Image inline floated='right' size='mini' src={dsMap[rowData.datasource_id].logo} circular></Image>
            }
                return (
                    <Table.Row key={rowData['email']} onClick={(event) => this.handleClick(event, rowData)} style={this.props.rowData === rowData ? { 'backgroundColor': '#2185d0' } : null}>
                        <Table.Cell width='1'>{avatarImage}</Table.Cell>
                        <Table.Cell >{rowData["full_name"]}</Table.Cell>
                        <Table.Cell >{rowData["email"]}</Table.Cell>
                        <Table.Cell >{dsImage}</Table.Cell>
                        <Table.Cell >{rowData["is_admin"]}</Table.Cell>
                        <Table.Cell >{rowData["member_type"]}</Table.Cell>
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
                <div>
                    <div ref="table" style={{ 'minHeight': usersData?null:document.body.clientHeight/2, 'maxHeight': document.body.clientHeight/1.05, 'overflow': 'auto', 'cursor': 'pointer' }}>
                        <Table celled selectable striped compact='very' sortable>
                            <Table.Header style={{'position': 'sticky', 'top': '50px', 'width': '100%'}}>
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
                        {(!tableRowData || tableRowData.length < this.props.pageLimit) ? null : (<Button color='green' size="mini" style={{ float: 'right', width: '80px' }} onClick={this.handleNextClick} >Next</Button>)}
                        {this.props.pageNumber > 0 ? (<Button color='green' size="mini" style={{ float: 'right', width: '80px' }} onClick={this.handlePreviousClick} >Previous</Button>) : null}
                    </div>
                </div>
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
