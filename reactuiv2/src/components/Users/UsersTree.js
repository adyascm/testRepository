import React, { Component } from 'react';
import { connect } from 'react-redux';

import { Statistic, Card, Loader, Segment, Dimmer } from 'semantic-ui-react'
import { USERS_TREE_LOADED, 
         USERS_TREE_LOAD_START,
         USERS_TREE_SET_ROW_DATA,
         SELECTED_USER_PARENTS_NAME 
        } from '../../constants/actionTypes';
import agent from '../../utils/agent';

import { AgGridReact } from "ag-grid-react";
import 'ag-grid/dist/styles/ag-grid.css';
import 'ag-grid/dist/styles/ag-theme-fresh.css';
import UserGroupCell from './UserGroupCell';

const mapStateToProps = state => ({
    ...state.users
});

const mapDispatchToProps = dispatch => ({
    onLoadStart: () =>
        dispatch({ type: USERS_TREE_LOAD_START }),
    onLoad: (payload) =>
        dispatch({ type: USERS_TREE_LOADED, payload }),
    setRowData: (payload) => 
        dispatch({type: USERS_TREE_SET_ROW_DATA, payload}),
    setSelectedUserParents: (payload) =>
        dispatch({type: SELECTED_USER_PARENTS_NAME,payload})
});

class UsersTree extends Component {
    constructor(props) {
        super(props);
        this.onCellClicked = this.onCellClicked.bind(this);
        this.cellExpandedOrCollapsed = this.cellExpandedOrCollapsed.bind(this);
        
        this.state = {
            cellData: '',
            columnDefs: [{
                    headerName: "Type",
                    field: "type",
                    hide: true,
                    sort: "asc",
                    cellRenderer: "agGroupCellRenderer",
                    cellStyle: {textAlign: "left"}
                },
                {
                    headerName: "Users and Groups",
                    field: "name",
                    sort: "asc",
                    cellStyle: {textAlign: "left"},
                    //cellRenderer: "agGroupCellRenderer"
                    cellRendererFramework: UserGroupCell,
                    cellRendererParams: {
                        cellExpandedOrCollapsed: this.cellExpandedOrCollapsed
                    }
                }]
        };
        
        this.gridOptions = {
            onRowClicked: this.onCellClicked,
            getNodeChildDetails: rowItem => {
                if (!rowItem.member_type) {
                    if (rowItem.children.length > 0) {
                        if (!rowItem.children[0]["key"]) {
                            var childRows = []
                            for (let index=0; index<rowItem.children.length; index++) {
                                let childRowItem = Object.assign({},this.props.usersTree[this.props.emailRowMap[rowItem.children[index]]])
                                childRowItem.depth = rowItem.depth + 1
                                childRows.push(childRowItem)
                            }
                            return {
                                group: true,
                                expanded: rowItem.isExpanded,
                                children: childRows,
                                key: rowItem.key
                            }
                        }
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

    onCellClicked(params) {
        console.log("params data : ", params.data)
        this.setState({
            cellData: params.data
        })
        this.props.setRowData(params.data);       
        let selectedUserEmail = params.data["key"]
        let selectedUserParentsEmail = params.data["parents"]
        let selectedUserParentsName = selectedUserParentsEmail.map((parent,index) => {
            return this.props.usersTree[this.props.emailRowMap[parent]]["name"]
        })
        this.props.setSelectedUserParents(selectedUserParentsName)
    }

    cellExpandedOrCollapsed(params) {
        console.log("cell expanded or collapsed")
        if (!params.data.isExpanded) {
            params.data["isExpanded"] = true
            let children = params.data["children"]
            for (let index=0; index<children.length; index++) {
                if (children[index]["depth"] !== undefined)
                    children[index]["depth"] = params.data["depth"] + 1
            }
            this.gridApi.setRowData(this.props.usersTree)
        }
        else {
            params.data["isExpanded"] = false
            let children = params.data["children"]
            for (let index=0; index<children.length; index++) {
                if (children[index]["depth"] !== undefined)
                    children[index]["depth"] -= 1
            }
            this.gridApi.setRowData(this.props.usersTree)
        }
    }

    componentWillMount() {
        this.props.onLoadStart();
        this.props.onLoad(agent.Users.getUsersTree());
    }
    onGridReady(params) {
        this.gridApi = params.api;
        this.gridColumnApi = params.columnApi;

        params.api.sizeColumnsToFit();
    }

    render() {
        if (!this.props.usersTree) {
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
                return null;
            }
        }
        else {
            return (
                <div className="ag-theme-fresh">
                    <AgGridReact
                        id="myGrid" domLayout="autoHeight"
                        columnDefs={this.state.columnDefs}
                        rowData={this.props.usersTree}
                        onGridReady={this.onGridReady.bind(this)}
                        gridOptions={this.gridOptions}
                    />
                </div>
            )
        }

    }
}
export default connect(mapStateToProps, mapDispatchToProps)(UsersTree);