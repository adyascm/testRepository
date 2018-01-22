import React, {Component} from 'react';
//import { StyleSheet, css } from 'aphrodite/no-important';
//import { border, spaces, colors } from '../designTokens';
import { AgGridReact } from 'ag-grid-react';
import { components } from '../designTokens';

class LogModelData extends Component {
  constructor(props) {
    super(props);
    this.onGridReady = this.onGridReady.bind(this);
    this.gridOptions = {
      rowHeight: components.agGridPopup.height,
      headerHeight:components.agGridPopup.height,
      enableColResize: true,
      //suppressRowClickSelection: true,
      //suppressCellSelection: true,
      //suppressScrollOnNewData: true,
      animateRows: true,
      enableSorting: true,
      enableFilter: true
    }
    this.columnDefs = [{
      headerName: 'Date',
      field:'date',
      width:200,
      valueGetter: params => {
        let date = new Date(params.data["ural_activity_log_time_stamp"]).toLocaleTimeString("en-us", {
            weekday: "long",
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
          })
        return date
      }
    },
    {
      headerName: 'Operation',
      field:'operation',
      width:100,
      valueGetter: params => {
        return params.data["ural_activity_log_event"]
      },

    },
    {
      headerName: 'Datasource',
      field:'datasource',
      width:150,
      valueGetter: params => {
        return params.data["datasources.name"]
      },

    },
    {
      headerName: this.props.showUserColumn ? 'User' : 'Resource',
      field:'resource',
      valueGetter: params => {
        if(this.props.showUserColumn){
          return params.data["user_full_name"]
        }
          return params.data["resource_path_to_id.resource_path"]
      },

    }];
  }
  onGridReady(params) {
    this.api = params.api;
    this.api.sizeColumnsToFit();
  }
  render() {
    const log = this.props.log || [];

    return (
        <div className="ag-dark agGridPop" style={{height: '100%'}}>
        <AgGridReact onGridReady={this.onGridReady}
                      columnDefs={this.columnDefs}
                     rowData={log}
                     gridOptions={this.gridOptions} />

          {/*<table className={css(s.activityTable)}>{tableEls}</table>*/}
          </div>
        );
  }
}

export default LogModelData;
