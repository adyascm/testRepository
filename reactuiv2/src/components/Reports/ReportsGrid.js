import React, {Component} from 'react';
import { AgGridReact } from "ag-grid-react";
import { Button } from 'semantic-ui-react'


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

    ],

    this.columnDefsForInactiveUsers = [
      {
        headerName: 'Name',
        field: 'name',
        cellRenderer: "agGroupCellRenderer",
        width: 150
      },
      {
          headerName: 'Email',
          field: 'email',
          cellRenderer: "agGroupCellRenderer",
          width: 250
      },
      {
          headerName: 'Last Login',
          field: 'login_time',
          cellRenderer: "agGroupCellRenderer",
          width: 250
      },
      {
          headerName: 'Number of days since last login',
          field: 'num_days',
          cellRenderer: "agGroupCellRenderer",
          width: 200
      }, 
    ],

    this.columnDefsForEmptyGSuiteGroup = [
      {
        headerName: 'Name',
        field: 'name',
        cellRenderer: "agGroupCellRenderer",
        width: 150
      },
      {
        headerName: 'Email',
        field: 'email',
        cellRenderer: "agGroupCellRenderer",
        width: 150
      },
    ],

    this.columnDefsForEmptySlackChannel = [
      {
        headerName: 'Name',
        field: 'name',
        cellRenderer: "agGroupCellRenderer",
        width: 150
      },
      {
        headerName: 'Email',
        field: 'email',
        cellRenderer: "agGroupCellRenderer",
        width: 150
      },
    ],

    this.columnDefsForExternalUsers = [
      {
        headerName: 'Source',
        field: 'source',
        cellRenderer: "agGroupCellRenderer",
        width: 150
      },
      {
        headerName: 'Name',
        field: 'name',
        cellRenderer: "agGroupCellRenderer",
        width: 150
      },
      {
        headerName: 'Email',
        field: 'email',
        cellRenderer: "agGroupCellRenderer",
        width: 150
      },
      {
        headerName: 'Resources Shared',
        field: 'exposed_docs_num',
        cellRenderer: "agGroupCellRenderer",
        width: 150
      }
    ],

    this.columnDefsForAdminUsers = [
      {
        headerName: 'Source',
        field: 'source',
        cellRenderer: "agGroupCellRenderer",
        width: 150
      },
      {
        headerName: 'Name',
        field: 'name',
        cellRenderer: "agGroupCellRenderer",
        width: 150
      },
      {
        headerName: 'Email',
        field: 'email',
        cellRenderer: "agGroupCellRenderer",
        width: 150
      },
    ]
  }

  onGridReady(params) {
    this.api = params.api;
    this.api.sizeColumnsToFit();
  }

  onBtExport = () => {
    var params = {
        fileName: this.props.runReportName
      }
       this.api.exportDataAsCsv(params)

  };

getColDef = () => {
  let colDef = null
  switch(this.props.reportType){
    case 'Permission':
      colDef = this.columnDefsForPerms
      break
    case 'Activity':
      colDef = this.columnDefsForActivity
      break
    case 'Inactive':
      colDef = this.columnDefsForInactiveUsers
      break
    case 'EmptyGSuiteGroup':
      colDef = this.columnDefsForEmptyGSuiteGroup
      break
    case 'EmptySlackChannel':
      colDef = this.columnDefsForEmptySlackChannel
      break    
    case 'External':
      colDef = this.columnDefsForExternalUsers
      break      
    case 'Admin':
      colDef = this.columnDefsForAdminUsers
      break      
  }
  return colDef
} 

  render() {
    return(
      <div className="ag-theme-fresh" style={{height: '500px'}}>
        <AgGridReact onGridReady={this.onGridReady}
                   columnDefs={this.getColDef()} 
                   rowData={this.props.reportsData}
                   />
                 <div>
                   <Button style={{marginTop: "3.5%", float: "right"}}basic color='green'
                     onClick={this.onBtExport} >
                    Export to csv
                   </Button>
                 </div>

      </div>
    )
  }
}

export default ReportsGrid;
