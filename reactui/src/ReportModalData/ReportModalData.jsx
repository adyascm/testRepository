import React, {Component} from 'react';
//import { StyleSheet, css } from 'aphrodite/no-important';
//import { border, spaces, colors } from '../designTokens';
import { AgGridReact } from 'ag-grid-react';
// import 'ag-grid/dist/styles/ag-grid.css';
// import 'ag-grid/dist/styles/theme-dark.css';
import { components } from '../designTokens';

class ReportModalData extends Component {
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
      width:100,
      valueGetter: params => {
        let date = new Date(params.data[4]).toLocaleTimeString("en-us", {
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
      width:80,
      valueGetter: params => {
        return params.data[1]
      },

    },
    {
      headerName: 'Datasource',
      field:'datasource',
      width:100,
      valueGetter: params => {
        return params.data[0]
      },

    },
    {
      headerName: 'User',
      field:'user',
      valueGetter: params => {
        return params.data[2]
      },

    },
    {
      headerName: 'Resource',
      field:'resource',
      valueGetter: params => {
        return params.data[3]
      },

    }];
  }
  onGridReady(params) {
    this.api = params.api;
    this.api.sizeColumnsToFit();
  }

  render() {
    const log = this.props.log || [];
    console.log(log)

    return (
        <div className="ag-dark agGridPop" style={{height: '100%'}}>
        <AgGridReact
        onGridReady={this.onGridReady}
                     columnDefs={this.columnDefs}
                    rowData={log}
                    gridOptions={this.gridOptions}
                      />

          {/*<table className={css(s.activityTable)}>{tableEls}</table>*/}
          </div>
        );
  }
}

export default ReportModalData;
