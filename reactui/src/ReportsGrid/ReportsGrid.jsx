import React,{Component} from 'react';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid/dist/styles/ag-grid.css';
import 'ag-grid/dist/styles/theme-dark.css';
import ReportsCell from './ReportsCell.jsx';
import { spaces, components } from '../designTokens';

class ReportsGrid extends Component {
  constructor(props) {
    super(props);
    this.state = {
      fileExposure: {
        1: 'Public',
        2: 'External',
        3: 'Internal',
        4: 'Domain',
        5: 'Private'
      }
    }
    this.onGridReady = this.onGridReady.bind(this);

    this.columnDefs = [{
      headerName: 'Shared To Email',
      field: 'Shared To Email',
      cellRendererFramework: ReportsCell,
      width: 300,
      valueGetter: params => {
        return params.data['users_email'];
      }
      },
      {
        headerName: 'File Name',
        field: 'File Name',
        cellRendererFramework: ReportsCell,
        width: 200,
        valueGetter: params => {
          return params.data['resource_name'];
        }
      },
      {
        headerName: 'File Type',
        field: 'File Type',
        cellRendererFramework: ReportsCell,
        width: 100,
        valueGetter: params => {
        return params.data['rd_type'];
        }
      },
        {
          headerName: 'Size',
          field: 'Size',
          cellRendererFramework: ReportsCell,
          width: 100,
          valueGetter: params => {
            return params.data['rd_size'];
          }
        },
          {
            headerName: 'Owner',
            field: 'Owner',
            cellRendererFramework: ReportsCell,
            width: 300,
            valueGetter: params => {
              return params.data['rd_owner_user_id'];
            }
          },
            {
              headerName: 'File Exposure',
              field: 'File Exposure',
              cellRendererFramework: ReportsCell,
              width: 100,
              valueGetter: params => {
                return this.state.fileExposure[params.data['rd_exposure']];
              }
            },
              {
                headerName: 'File Path',
                field: 'File Path',
                cellRendererFramework: ReportsCell,
                width: 300,
                valueGetter: params => {
                  return params.data['resource_path'];
                }
              }];

        this.gridOptions = {
          rowHeight: components.dataTableRow.height,
          enableColResize: true,
          enableFilter: true,
          enableSorting: true,
          suppressCellSelection: true,
          suppressRowClickSelection: true,
          suppressScrollOnNewData: true,
          animateRows: true,
          //suppressCsvExport: false
          //suppressDragLeaveHidesColumns: true
        };
  }

  onGridReady(params) {
    this.api = params.api;
    this.props.registerDashboardApi(params.api);
    setTimeout(()=> this.gridOptions.api.refreshView(),0);
    this.api.sizeColumnsToFit();
  }

  render() {
    console.log("Reports grid data : ", this.props.reportsData);
    return(
      <div className="ag-dark" style={{height: '100%'}}>
        <AgGridReact onGridReady={this.onGridReady}
                   columnDefs={this.columnDefs}
                   rowData={this.props.reportsData}
                   gridOptions={this.gridOptions} />
      </div>
    )
  }
}

export default ReportsGrid;
