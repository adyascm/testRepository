import React, { Component } from 'react';
import { connect } from 'react-redux';

import { Statistic, Card, Loader, Segment, Dimmer } from 'semantic-ui-react'
import {
    USER_ITEM_SELECTED
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
    selectUserItem: (payload) =>
        dispatch({ type: USER_ITEM_SELECTED, payload })
});

class UsersTree extends Component {
    constructor(props) {
        super(props);
        this.onCellClicked = this.onCellClicked.bind(this);
        this.cellExpandedOrCollapsed = this.cellExpandedOrCollapsed.bind(this);

        this.state = {
            rows: undefined,
            showOnlyExternal: props.showOnlyExternal,
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
                sort: "asc",
                cellStyle: { textAlign: "left" },
                //cellRenderer: "agGroupCellRenderer"
                cellRendererFramework: UserGroupCell,
                cellRendererParams: {
                    cellExpandedOrCollapsed: this.cellExpandedOrCollapsed
                }
            },
            {
                headerName: "Email",
                field: "key",
                cellStyle: { textAlign: "left" },
                cellRenderer: "agTextCellRenderer"
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

    componentWillReceiveProps(nextProps){
        console.log("nextprops userstree : ", nextProps.usersTreePayload)
        if(this.state.showOnlyExternal != nextProps.showOnlyExternal)
        {
            this.setState({
                ...this.state,
                showOnlyExternal: nextProps.showOnlyExternal,
                rows: undefined
            })
        }
        // if (nextProps.usersTreePayload !== this.props.usersTreePayload)
        //     this.setTreeRows(nextProps.usersTreePayload)
    }
    setTreeRows() {
        if(this.props.usersTreePayload)
        {
            let rows = []
            let emailRowMap = {}
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
                    rowItem.name = rowItem.firstName + " " + rowItem.lastName;
                }
                else
                    rowItem.type = rowItem.type || "group";
                if(this.state.showOnlyExternal)
                {
                    if(rowItem.member_type != 'EXT')
                        continue;
                } 
                else if(rowItem.type == "user") {
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
    onCellClicked(params) {
        console.log("params data : ", params.data)
        this.props.selectUserItem(params.data);
    }

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

        params.api.sizeColumnsToFit();
    }

    render() {
        if(!this.state.rows){
            this.setTreeRows();
        }
        return (
            <div className="ag-theme-fresh" style={{ maxHeight: document.body.clientHeight, overflow: "auto" }}>
                <AgGridReact
                    id="myGrid" 
                    domLayout="autoHeight"
                    columnDefs={this.state.columnDefs}
                    rowData={this.state.rows}
                    enableFilter={true}
                    onGridReady={this.onGridReady.bind(this)}
                    gridOptions={this.gridOptions}
                />
            </div>
        )
    }
}
export default connect(mapStateToProps, mapDispatchToProps)(UsersTree);