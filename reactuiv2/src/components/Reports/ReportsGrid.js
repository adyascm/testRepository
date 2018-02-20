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
          field: 'resource_name',
          cellRenderer: "agGroupCellRenderer",
          width: 200
      },
      {
        headerName: 'File Type',
        field: 'resource_type',
        cellRenderer: "agGroupCellRenderer",
        width: 100
      },
        {
          headerName: 'Size',
          field: 'resource_size',
          cellRenderer: "agGroupCellRenderer",
          width: 100
        },
        {
          headerName: 'Owner',
          field: 'resource_owner_id',
          cellRenderer: "agGroupCellRenderer",
          width: 200
        },
        {
          headerName: 'Last Modified Date',
          field: 'last_modified_time',
          cellRenderer: "agGroupCellRenderer",
          width: 200
        },
        {
          headerName: 'Creation Date',
          field: 'creation_time',
          cellRenderer: "agGroupCellRenderer",
          width: 200
        },
        {
          headerName: 'File Exposure',
          field: 'exposure_type',
          cellRenderer: "agGroupCellRenderer",
          width: 100
        },
        {
          headerName: 'Email',
          field: 'user_email',
          cellRenderer: "agGroupCellRenderer",
          width: 100
        },
        {
          headerName: 'Permission',
          field: 'permission_type',
          cellRenderer: "agGroupCellRenderer",
          width: 100
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
