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
        
        this.state = {
            cellData: '',
            columnDefs: [
                {
                    headerName: "Users and Groups",
                    field: "name",
                    sort: "asc",
                    cellStyle: {textAlign: "left"},
                    cellRenderer: "agGroupCellRenderer"
                }
            ]
        };
        
        this.gridOptions = {
            onRowClicked: this.onCellClicked,
            getNodeChildDetails: rowItem => {
                if (!rowItem.member_type) {
                    return {
                        group: true,
                        expanded: false,
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