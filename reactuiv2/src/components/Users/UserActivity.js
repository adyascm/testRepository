import React, { Component } from 'react';
import agent from '../../utils/agent'
import { Loader, Dimmer } from 'semantic-ui-react'

import { connect } from 'react-redux';


import { AgGridReact } from "ag-grid-react";
import 'ag-grid/dist/styles/ag-grid.css';
import 'ag-grid/dist/styles/ag-theme-fresh.css';

import {
    USERS_ACTIVITY_LOAD_START,
    USERS_ACTIVITY_LOADED
} from '../../constants/actionTypes';


const mapStateToProps = state => ({
    ...state.users
});

const mapDispatchToProps = dispatch => ({
    onLoadStart: (payload) =>
        dispatch({ type: USERS_ACTIVITY_LOAD_START, payload }),
    onLoad: (payload) =>
        dispatch({ type: USERS_ACTIVITY_LOADED, payload })
});



class UserActivity extends Component {

    constructor(props) {
        super(props);

        this.state = {
            columnDefs: [
                {
                    headerName: "Date",
                    valueGetter: params => {
                        return params.data[0];
                    }
                },
                {
                    headerName: "Operation",
                    valueGetter: params => {
                        return params.data[1];
                    }
                },
                {
                    headerName: "Datasource",
                    valueGetter: params => {
                        return params.data[2];
                    }
                },
                {
                    headerName: "Resource",
                    valueGetter: params => {
                        return params.data[3];
                    }
                },
                {
                    headerName: "Type",
                    valueGetter: params => {
                        return params.data[4];
                    }
                },
                {
                    headerName: "IP Address",
                    valueGetter: params => {
                        return params.data[5];
                    }
                }
            ],
            rowData: []
        };
    }

    componentWillReceiveProps(nextProps) {
        if (this.props.selectedUserItem["key"] != nextProps.selectedUserItem["key"] && !nextProps.selectedUserItem.activities) {
            nextProps.onLoadStart(nextProps.selectedUserItem["key"])
            nextProps.onLoad(agent.Activity.getActivitiesForUser(nextProps.selectedUserItem["key"]))
        }
    }

    componentWillMount() {
        if (this.props.selectedUserItem && !this.props.selectedUserItem.activities) {
            this.props.onLoadStart(this.props.selectedUserItem["key"])
            this.props.onLoad(agent.Activity.getActivitiesForUser(this.props.selectedUserItem["key"]))
        }
    }

    onGridReady(params) {
        this.gridApi = params.api;
        this.gridColumnApi = params.columnApi;
        params.api.sizeColumnsToFit();
    }

    render() {
        if (this.props.isActivitiesLoading) {
            return (
                <div className="ag-theme-fresh" style={{ height: '200px' }}>
                    <Dimmer active inverted>
                        <Loader inverted content='Loading' />
                    </Dimmer>
                </div>
            )
        }
        else if (this.props.selectedUserItem){
            return (
                <div className="ag-theme-fresh">
                    <AgGridReact
                        id="myGrid" domLayout="autoHeight"
                        columnDefs={this.state.columnDefs}
                        rowData={this.props.selectedUserItem.activities}
                        onGridReady={this.onGridReady.bind(this)}
                    />
                </div>
            )
        }
        return null;
    }
}



export default connect(mapStateToProps, mapDispatchToProps)(UserActivity);
