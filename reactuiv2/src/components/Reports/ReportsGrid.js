import React, {Component} from 'react';
import { AgGridReact } from "ag-grid-react";
import { Button, Dimmer, Loader } from 'semantic-ui-react'


class ReportsGrid extends Component {
  constructor(props){
    super(props);

    this.onGridReady = this.onGridReady.bind(this)
    this.columnDefsForPerms = [
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
          headerName: 'User Email',
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

    this.columnDefsForActivity = [
      {
          headerName: 'Date',
          field: 'date',
          cellRenderer: "agGroupCellRenderer",
          width: 200
      },
      {
          headerName: 'Operation',
          field: 'operation',
          cellRenderer: "agGroupCellRenderer",
          width: 200
      },
      {
          headerName: 'Datasource',
          field: 'datasource',
          cellRenderer: "agGroupCellRenderer",
          width: 200
      },
      {
          headerName: 'Resource',
          field: 'resource',
          cellRenderer: "agGroupCellRenderer",
          width: 200
      },
      {
          headerName: 'Type',
          field: 'type',
          cellRenderer: "agGroupCellRenderer",
          width: 200
      },
      {
          headerName: 'Ip Address',
          field: 'ip_address',
          cellRenderer: "agGroupCellRenderer",
          width: 200
      },

    ]
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
                   columnDefs={this.props.reportType === 'Permission'? this.columnDefsForPerms : this.columnDefsForActivity }
                   rowData={this.props.reportsData}
                   />


      </div>
    )
  }
}

export default ReportsGrid;
