import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Dimmer, Loader } from 'semantic-ui-react'

import {
    USERS_PAGE_LOAD_START,
    USERS_PAGE_LOADED,
    USER_ITEM_SELECTED
} from '../../constants/actionTypes';

import { AgGridReact } from "ag-grid-react";
import 'ag-grid/dist/styles/ag-grid.css';
import 'ag-grid/dist/styles/ag-theme-fresh.css';
import UserGroupCell from './UserGroupCell';
import agent from '../../utils/agent'

const mapStateToProps = state => ({
    ...state.users
});

const mapDispatchToProps = dispatch => ({
    selectUserItem: (payload) =>
        dispatch({ type: USER_ITEM_SELECTED, payload }),
    loadUsersTreeData: (payload) =>
        {
            dispatch({ type: USERS_PAGE_LOAD_START });
            dispatch({ type: USERS_PAGE_LOADED, payload });
        }
});

class UsersTree extends Component {
    constructor(props) {
        super(props);
        //this.onCellClicked = this.onCellClicked.bind(this);
        this.cellExpandedOrCollapsed = this.cellExpandedOrCollapsed.bind(this);

        this.state = {
            rows: undefined,
            showMemberType: props.showMemberType,
            displaySearchData: false,
            usersFilter: {
                'EXT': 'external',
                'DOMAIN': 'internal',
                'ALL': ''
            },
            columnDefs: [{
                headerName: "Type",
                field: "type",
                hide: true,
                sort: "asc",
                cellRenderer: "agGroupCellRenderer",
                cellStyle: { textAlign: "left" }
            },
            {
                headerName: "Groups",
                field: "name",
                suppressSorting:true,
                cellStyle: { textAlign: "left" },
                //cellRenderer: "agGroupCellRenderer"
                cellRendererFramework: UserGroupCell,
                cellRendererParams: {
                    cellExpandedOrCollapsed: this.cellExpandedOrCollapsed
                },
                width: document.body.clientWidth/2
            },
            {
                headerName: "Email",
                field: "key",
                sort: "asc",
                cellStyle: { textAlign: "left" },
                cellRenderer: "agTextCellRenderer",
                width: document.body.clientWidth/2
            },
            {
                headerName: "Type",
                field: "member_type",
                hide: true,
                cellRenderer: "agTextCellRenderer",
                cellStyle: { textAlign: "left" }
            }]
        };

        this.gridOptions = {
            onRowClicked: this.onCellClicked,
            getNodeChildDetails: rowItem => {
                if (!rowItem.member_type) {
                    if (rowItem.children && rowItem.children.length > 0) {
                        var childRows = []
                        for (let index = 0; index < rowItem.children.length; index++) {
                            var childRowItem = {}
                            if (!rowItem.children[index].type)
                                childRowItem = Object.assign({}, this.props.usersTreePayload[rowItem.children[index]])
                            else
                                childRowItem = Object.assign({}, rowItem.children[index])
                            childRowItem.depth = rowItem.depth + 1
                            childRows.push(childRowItem)
                        }
                        rowItem['children'] = childRows;
                    }
                    return {
                        group: true,
                        expanded: rowItem.isExpanded,
                        children: rowItem.children || [],
                        key: rowItem.key
                    }
                }
                else
                    return null
            }
        }
        
    }

    componentWillMount() {
        this.props.loadUsersTreeData(agent.Users.getUsersTree())
    }

    componentWillReceiveProps(nextProps){
        // if(this.state.showOnlyExternal !== nextProps.showOnlyExternal)
        // {
        //     this.setState({
        //         ...this.state,
        //         showOnlyExternal: nextProps.showOnlyExternal,
        //         rows: undefined
        //     })
        // }

        if (nextProps.groupSearchPayload && (!this.state.displaySearchData ||  
            (nextProps.showMemberType !== this.state.showMemberType))) {
            let rows = []
            let keys = Object.keys(nextProps.groupSearchPayload)

            for (let index = 0; index < keys.length; index++) {
                let rowItem = nextProps.groupSearchPayload[keys[index]]
                if (!rowItem.key)
                    rowItem.key = keys[index]
                
                if (rowItem.depth === undefined)
                    rowItem.depth = 0
                rowItem.isExpanded = rowItem.isExpanded || false
                if (!rowItem.name ) {
                    rowItem.type = rowItem.type || "user";
                    rowItem.name = rowItem.first_name + " " + rowItem.last_name;
                }
                else
                    rowItem.type = rowItem.type || "group";
                if (nextProps.showMemberType === 'EXT') {
                    if (rowItem.member_type !== 'EXT')
                        continue
                }
                else if (nextProps.showMemberType === 'DOMAIN') {
                    if (rowItem.member_type !== 'INT')
                        continue
                }
                else if(rowItem.type === "user") {
                    continue;
                }
                rows.push(rowItem)
            }
            this.setState({
                rows: rows,
                displaySearchData: true,
                showMemberType: nextProps.showMemberType
            })
        }

        if (!nextProps.groupSearchPayload) {
            this.setState({
                rows: undefined,
                showMemberType: nextProps.showMemberType
            })
        }  
    }

    setTreeRows() {
        if(this.props.usersTreePayload)
        {
            let rows = []
            //let emailRowMap = {}
            let keys = Object.keys(this.props.usersTreePayload)
    
            for (let index = 0; index < keys.length; index++) {
                let rowItem = this.props.usersTreePayload[keys[index]]
                if (!rowItem.key)
                    rowItem.key = keys[index]
                
                if (rowItem.depth === undefined)
                    rowItem.depth = 0
                rowItem.isExpanded = rowItem.isExpanded || false
                if (!rowItem.name ) {
                    rowItem.type = rowItem.type || "user";
                    rowItem.name = rowItem.first_name + " " + rowItem.last_name;
                }
                else
                    rowItem.type = rowItem.type || "group";
                if (this.state.showMemberType === 'EXT') {
                    if (rowItem.member_type !== 'EXT')
                        continue
                }
                else if (this.state.showMemberType === 'DOMAIN') {
                    if (rowItem.member_type !== 'INT')
                        continue
                }
                else if(rowItem.type === "user") {
                    continue;
                }
                rows.push(rowItem)
            }
            this.setState({
                ...this.state,
                rows: rows
            })
        }
    }
    // onCellClicked(params) {
    //     this.props.selectUserItem(params.data);
    // }

    cellExpandedOrCollapsed(params) {
        
        if (!params.data.isExpanded) {
            params.data["isExpanded"] = true
            this.gridApi.setRowData(this.state.rows)
        }
        else {
            params.data["isExpanded"] = false
            this.gridApi.setRowData(this.state.rows)
        }
    }


    onGridReady(params) {
        this.gridApi = params.api;
        this.gridColumnApi = params.columnApi;
    }

    render() {
        if (this.props.isLoadingUsers) 
            return (
                <Dimmer active inverted>
                    <Loader inverted content='Loading' />
                </Dimmer>
            )
        else if(this.props.usersTreePayload && !this.state.rows){
            this.setTreeRows();
        }
        else if (this.state.rows && this.state.rows.length)
            return (
                <div className="ag-theme-fresh" style={{ maxHeight: document.body.clientHeight/1.25, overflow: "auto" }}>
                    <AgGridReact
                        id="myGrid" 
                        domLayout="autoHeight"
                        columnDefs={this.state.columnDefs}
                        rowData={this.state.rows}
                        enableFilter={true}
                        enableSorting={true}
                        sortingOrder={['asc']}
                        onGridReady={this.onGridReady.bind(this)}
                        gridOptions={this.gridOptions}
                    />
                </div>
            )
        else 
            return (
                <div style={{'textAlign': 'center'}}>
                    No {this.state.usersFilter[this.props.showMemberType]} users to display
                </div>
            )
        return null
    }
}
export default connect(mapStateToProps, mapDispatchToProps)(UsersTree);