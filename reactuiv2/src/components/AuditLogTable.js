import React, { Component } from 'react';
import { connect } from 'react-redux';

import { Loader, Dimmer, Button, Table, Dropdown, Form, Input, Label } from 'semantic-ui-react';
import DateComponent from './DateComponent'
import agent from '../utils/agent';

import {
    AUDIT_LOG_LOAD_START,
    AUDIT_LOG_LOADED
} from '../constants/actionTypes';


const mapStateToProps = state => ({
    ...state.auditlog
});

const mapDispatchToProps = dispatch => ({
    onLoadStart: () => dispatch({ type: AUDIT_LOG_LOAD_START }),
    onLoad: (payload) => dispatch({ type: AUDIT_LOG_LOADED, payload })
});

class AuditLogTable extends Component {
    constructor(props) {
        super(props);

        this.state = {
            columnHeaders: [
                "Id",
                "Time",
                "Action Name",
                "Performed On",
                "Status",
                "Message"
            ]
        }
    }

    componentWillMount() {
        window.scrollTo(0, 0)
        this.props.onLoadStart()
        this.props.onLoad(agent.AuditLog.getAuditLogList())
    }    

    render() {
        let tableHeaders = this.state.columnHeaders.map((headerName, index) => {
            return (
                <Table.HeaderCell key={index}>{headerName}</Table.HeaderCell>
            )
        })

        let tableRowData = null
        
        if (this.props.log)
            tableRowData = this.props.log.map((rowData, index) => {
                return (
                    <Table.Row key={index}>
                        <Table.Cell>{rowData["log_id"]}</Table.Cell>
                        <Table.Cell><DateComponent value={rowData["timestamp"]} /></Table.Cell>
                        <Table.Cell>{rowData["action_name"]}</Table.Cell>
                        <Table.Cell>{rowData["affected_entity"]}</Table.Cell>
                        <Table.Cell>{rowData["status"]}</Table.Cell>
                        <Table.Cell>{rowData["message"]}</Table.Cell>
                    </Table.Row>
                )
            })
        
        if (this.props.isLoadingAuditLog)
            return (
                <div style={{ height: '200px' }}>
                    <Dimmer active inverted>
                        <Loader inverted content='Loading' />
                    </Dimmer>
                </div>
            )
        else {
            if (this.props.log && this.props.log.length)
                return (
                    <div>
                        <div>
                            <Table celled selectable striped compact='very'>
                                <Table.Header>
                                    <Table.Row>
                                        {tableHeaders}
                                    </Table.Row>
                                </Table.Header>
                                <Table.Body>
                                    {tableRowData}
                                </Table.Body>
                            </Table>
                        </div>
                    </div>
                )
            else 
                return (
                    <div style={{ 'textAlign': 'center' }}>
                        No logs to display
                    </div>
                )
        }        
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(AuditLogTable);