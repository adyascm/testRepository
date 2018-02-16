import React, {Component} from 'react';
import { AgGridReact } from "ag-grid-react";
import { Button } from 'semantic-ui-react'


class ReportsGrid extends Component {
  constructor(props){
    super(props);

    this.onGridReady = this.onGridReady.bind(this)
    this.columnDefs = [
      {
          headerName: 'File Name',
          field: 'datasource_id',
          cellRenderer: "agGroupCellRenderer",
          width: 200,
          valueGetter: params => {
            return params.data[1]['resource_name'];
          }
      },
      {
        headerName: 'File Type',
        field: 'datasource_id',
        cellRenderer: "agGroupCellRenderer",
        width: 100,
        valueGetter: params => {
        return params.data[1]['resource_type'];
        }
      },
        {
          headerName: 'Size',
          field: 'datasource_id',
          cellRenderer: "agGroupCellRenderer",
          width: 100,
          valueGetter: params => {
            return params.data[1]['resource_size'];
          }
        },
       {
         headerName: 'Domain',
          field: 'datasource_id',
          cellRenderer: "agGroupCellRenderer",
          width: 300,
          valueGetter: params => {
            return params.data[0]['domain_id'];
          }
        },
        {
          headerName: 'File Exposure',
          field: 'datasource_id',
          cellRenderer: "agGroupCellRenderer",
          width: 100,
          valueGetter: params => {
            return params.data[1]['exposure_type'];
          }
        },
        {
          headerName: 'Permission',
          field: 'datasource_id',
          cellRenderer: "agGroupCellRenderer",
          width: 300,
          valueGetter: params => {
            return params.data[0]['permission_type'];
          }
        }

    ];
  }

  onGridReady(params) {
    this.api = params.api;
    this.api.sizeColumnsToFit();
  }

  handleClose = () => {

  }

  render() {
    console.log("Reports grid data : ", this.props.reportsData);
    return(
      <div className="ag-theme-fresh" style={{height: '500px'}}>
        <AgGridReact onGridReady={this.onGridReady}
                   columnDefs={this.columnDefs}
                   rowData={this.props.reportsData}
                   //gridOptions={this.gridOptions}
                   />


      </div>
    )
  }
}

export default ReportsGrid;
