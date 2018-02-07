import React, { Component } from 'react';
import { connect } from 'react-redux';

import { Statistic, Card, Loader, Segment, Dimmer } from 'semantic-ui-react'
import { DASHBOARD_WIDGET_LOADED, DASHBOARD_WIDGET_LOAD_START, USERS_TREE_LOADED, USERS_TREE_LOAD_START } from '../../constants/actionTypes';
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
        dispatch({ type: USERS_TREE_LOADED, payload })
});

class UsersTree extends Component {
    constructor() {
        super();
        this.state = {
            columnDefs: [
                {
                    headerName: "Group",
                    field: "group",
                    cellRenderer: "agGroupCellRenderer"
                },
                {
                    headerName: "Last Active",
                    field: "last_active"
                }
            ],
            rowData: [
                {
                    group: "Group A",
                    participants: [
                        {
                            group: "A.1",
                            last_active: "10 mins",
                        },
                        {
                            group: "A.2",
                            last_active: "10 mins",
                        },
                        {
                            group: "A.3",
                            last_active: "10 mins",
                        }
                    ]
                },
                {
                    group: "Group B",
                    last_active: "10 mins",
                    participants: [
                        {
                            group: "B.1",
                            last_active: "10 mins",
                        },
                        {
                            group: "B.2",
                            last_active: "10 mins",
                        },
                        {
                            group: "B.3",
                            last_active: "10 mins",
                        },
                        {
                            group: "B.4",
                            last_active: "10 mins",
                        },
                        {
                            group: "B.5",
                            last_active: "10 mins",
                        }
                    ]
                },
                {
                    group: "Group C",
                    last_active: "10 mins",
                    participants: [
                        {
                            group: "C.1",
                            last_active: "10 mins",
                        },
                        {
                            group: "C.2",
                            last_active: "10 mins",
                        }
                    ]
                }
            ],
            getNodeChildDetails: function getNodeChildDetails(rowItem) {
                if (rowItem.participants) {
                    return {
                        group: true,
                        expanded: rowItem.group === "Group C",
                        children: rowItem.participants,
                        key: rowItem.group
                    };
                } else {
                    return null;
                }
            }
        };
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
        console.log(this.props.usersTree);
        if(!this.props.usersTree)
        {
            if(this.props.isLoading)
            {
                return(
                    <div className="ag-theme-fresh" style={{height: '200px'}}>
                    <Dimmer active inverted>
                            <Loader inverted content='Loading' />
                        </Dimmer>
                    </div>
                )
            }
        }
        return (
            <div className="ag-theme-fresh">
                <AgGridReact
                    id="myGrid" domLayout="autoHeight"
                    columnDefs={this.state.columnDefs}
                    rowData={this.state.rowData}
                    getNodeChildDetails={this.state.getNodeChildDetails}
                    onGridReady={this.onGridReady.bind(this)}
                />
            </div>
        )
    }
}
export default connect(mapStateToProps, mapDispatchToProps)(UsersTree);