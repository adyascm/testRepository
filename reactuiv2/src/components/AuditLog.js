import React, { Component } from 'react';
import { connect } from 'react-redux';

import { Loader, Dimmer } from 'semantic-ui-react';
import { AgGridReact } from "ag-grid-react";
import 'ag-grid/dist/styles/ag-grid.css';
import 'ag-grid/dist/styles/ag-theme-fresh.css';

import agent from '../utils/agent';

import {
    AUDIT_LOG_LOAD_START,
    AUDIT_LOG_LOADED
} from '../constants/actionTypes';


const mapStateToProps = state => ({
    ...state.auditLog
});

const mapDispatchToProps = dispatch => ({
    onLoadStart: () => dispatch({ type: AUDIT_LOG_LOAD_START }),
    onLoad: (payload) => dispatch({ type: AUDIT_LOG_LOADED, payload })
});

class AuditLog extends Component {
    constructor(props) {
        super(props);

        this.columnDefs = [
            {
                headerName: "Time",
                field: "timestamp"
            },
            {
                headerName: "Action Name",
                field: "action_name"
            },
            {
                headerName: "Performed On",
                field: "affected_entity"
            },
            {
                headerName: "Type",
                field: "affected_entity_type"
            },
            {
                headerName: "Parameters",
                field: "parameters"
            }
        ];
    }

    onGridReady(params) {
        this.gridApi = params.api;
        this.gridColumnApi = params.columnApi;
        params.api.sizeColumnsToFit();
    }

    componentWillMount() {
        this.props.onLoadStart()
        this.props.onLoad(agent.AuditLog.getAuditLogList())
    }

    render() {
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
            return (
                <div className="ag-theme-fresh" style={{ "height": document.body.clientHeight }}>
                    <AgGridReact
                        id="myGrid" 
                        //domLayout="autoHeight"
                        rowSelection='single' 
                        suppressCellSelection='true'
                        rowData={this.props.auditlog}
                        columnDefs={this.columnDefs}
                        onGridReady={this.onGridReady.bind(this)}
                        //pagination={true}
                    />
                </div>
            )
        }

    }
}

export default connect(mapStateToProps, mapDispatchToProps)(AuditLog);