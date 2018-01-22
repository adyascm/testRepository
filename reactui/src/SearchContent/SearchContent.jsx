import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { StyleSheet, css } from 'aphrodite/no-important';
import { AgGridReact } from 'ag-grid-react';
import { spaces, components } from '../designTokens';
import ResourceCell from './ResourceCell';
import 'ag-grid/dist/styles/ag-grid.css';
import 'ag-grid/dist/styles/theme-dark.css';
import '../GlobalStyles/UserListGlobalStyles';

const s = StyleSheet.create({
  placeholder: {
    padding: spaces.m,
    margin: 0,
    textAlign: 'center',
    textTransform: 'none',
    fontWeight: 'bold'
  }
});

class SearchContent extends Component {
  constructor(props) {
    super(props);

    this.onGridReady = this.onGridReady.bind(this);

    this.columnDefs = [{
      headerName: 'File Name',
      field: 'Name',
      cellRendererFramework: ResourceCell,
      width: 250,
      valueGetter: params => {
        return params.data['resource_name'];
      }
      },
      {
        headerName: 'File Path',
        field: 'Path',
        cellRendererFramework: ResourceCell,
        width: 400,
        valueGetter: params => {
          return params.data['resource_path'];
        }
      },
      {
        headerName: 'File Type',
        field: 'Type',
        cellRendererFramework: ResourceCell,
        width: 100,
        valueGetter: params => {
          return params.data['rd_type'];
        }
      },
        {
          headerName: 'Owner',
          field: 'Owner',
          cellRendererFramework: ResourceCell,
          width: 300,
          valueGetter: params => {
            return params.data['rd_owner_user_id'];
          }
        },
          {
            headerName: 'Size (KB)',
            field: 'Size',
            cellRendererFramework: ResourceCell,
            width: 100,
            valueGetter: params => {
              return params.data['rd_size'];
            }
          },
            {
              headerName: 'Creation Date',
              field: 'Creation Date',
              cellRendererFramework: ResourceCell,
              width: 200,
              valueGetter: params => {
                return params.data['rd_creation_datetime'];
              }
            },
              {
                headerName: 'Modified Date',
                field: 'Modified Date',
                cellRendererFramework: ResourceCell,
                width: 200,
                valueGetter: params => {
                  return params.data['rd_last_modified_datetime'];
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
    this.props.registerResourceTreeApi(params.api);
    // console.log(this.props.onBtExport);
    // this.props.onBtExport(params.api);
    setTimeout(()=> this.gridOptions.api.refreshView(),0);

  }

  render() {
    let searchMetadata = this.props.getSearchMetadata;
    console.log("searchMetadata: ", searchMetadata);

    if (this.props.submit) {
      return(


          <div className="ag-dark" style={{height: '85%'}}>
          {searchMetadata.length != 0 ?

            <AgGridReact onGridReady={this.onGridReady}
                       columnDefs={this.columnDefs}
                       rowData={searchMetadata}
                       gridOptions={this.gridOptions} />

         :
          <h2 className={css(s.placeholder)}> None of your files or folders matched this search. </h2>}
        </div>
      );
    }
    else {
      return(
        <div></div>
      );
    }
  }
}

export default SearchContent;
