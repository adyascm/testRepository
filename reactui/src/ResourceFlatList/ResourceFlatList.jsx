import React, { Component } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { components } from '../designTokens';
import EmailCell from '../EmailCell';
import { StyleSheet, css } from 'aphrodite/no-important';
import Loader from '../Loader';
import ExportCsvButton from '../ExportCsvButton';

const s = StyleSheet.create({
  loader: {
    position:'absolute',
    top:'50%',
    left:'50%',
    transform:'translate(-50%,-50%)'
  },
  loaderText: {
    position:'relative',
    top:'-2px',
    left:5,
  }
});

class ResourceFlatList extends Component {
  constructor(props) {
    super(props);
    this.onGridReady = this.onGridReady.bind(this);
    this.onResourceCellClick = this.onResourceCellClick.bind(this);
    this.columnDefs = [{
      headerName: 'File Name',
      width: 100,
      cellRendererFramework: EmailCell,
      valueGetter: params => {
        return params.data["resource_name"];
      }
    }, {
      headerName: 'File Path',
      width: 150,
      cellRendererFramework: EmailCell,
      valueGetter: params => {
        return params.data["resource_path"];
      }
    },
    {
      headerName: 'Permission',
      width: 100,
      cellStyle: { 'text-align': 'center' },
      cellRendererFramework: EmailCell,
      valueGetter: params => {
        return params.data["urp_perm"];
      }
    },
    {
      headerName: 'Datasource Name',
      width: 100,
      cellRendererFramework: EmailCell,
      valueGetter: params => {
        return params.data["datasources.name"];
      }
    }];

    this.gridOptions = {
      rowHeight: components.dataTableRow.height,
      onRowClicked: this.onResourceCellClick,
      enableColResize: true,
      suppressScrollOnNewData: true,
      suppressRowClickSelection: true,
      suppressCellSelection: true,
      animateRows: true,
      enableSorting: true,
      enableFilter: true,
      // columnDefs:coldef(),
    };
  }
  // function coldef()
  // {
  //   this.columnDefs.push
  //   ({
  //       headerName: 'Group Name',
  //       cellRendererFramework:EmailCell
  //       width:100,
  //     });
  // }
  onGridReady(params) {
    this.api = params.api;
    //this.props.fileTreeCsvData(params.api);
    this.api.sizeColumnsToFit();
  }
  onResourceCellClick(params) {
   /* this.props.setActiveUser(params.data);
    setTimeout(() => this.props.refreshAllTrees(), 0);*/
  }
  render() {
    if(this.props.isFetched) {
      return (
        <div className="ag-dark" style={{height: '100%', position:'relative'}}>
        <div className={css(s.loader)}>
          <Loader size='xs'/>
          <span className={css(s.loaderText)}>Loading...</span>
        </div>
        </div>
      )
    } else if(this.props.dataList.length===0) {
      return (
        <div className="ag-dark" style={{height: '100%', position:'relative'}}>
          <div className={css(s.loader)}>
            <span className={css(s.loaderText)}>No data found</span>
          </div>
        </div>
      );
    }
    return (
      <div className="ag-dark" style={{height: '100%', position:'relative'}}>
        <AgGridReact onGridReady={this.onGridReady}
           columnDefs={this.columnDefs}
           rowData={this.props.dataList}
           gridOptions={this.gridOptions}
        />
      </div>
    );
  }
}

export default ResourceFlatList;
