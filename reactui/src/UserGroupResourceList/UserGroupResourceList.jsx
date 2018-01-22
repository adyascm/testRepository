import React, { Component } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { components } from '../designTokens';
import EmailCell from '../EmailCell';
import { StyleSheet, css } from 'aphrodite/no-important';
import Loader from '../Loader';

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

class UserGroupResourceList extends Component {
  constructor(props) {
    super(props);
    this.onGridReady = this.onGridReady.bind(this);

    this.columnDefs = [{
      headerName: 'Name',
      width: 150,
      cellRendererFramework: EmailCell,
      valueGetter: params => {
        return params.data[0];
      }
    }, {
      headerName: 'Email',
      width: 400,
      cellRendererFramework: EmailCell,
      valueGetter: params => {
        return params.data[1];
      }
    },
    {
      headerName: 'Permission',
      width: 150,
      cellStyle: { 'text-align': 'center' },
      cellRendererFramework: EmailCell,
      valueGetter: params => {
        let permission;
        if(params.data[2])
        {
          permission='W';
        }else{
          permission='R';
        }
        return permission;
      }
    },
    {
      headerName: 'Type',
      width: 150,
      cellRendererFramework: EmailCell,
      valueGetter: params => {
        var isGroup;
        if(params.data[3]){
          isGroup="Group";
        }else{
          isGroup="User";
        }
        return isGroup;
      }
    }];

    this.gridOptions = {
      rowHeight: components.dataTableRow.height,
      enableColResize: true,
      suppressScrollOnNewData: true,
      suppressRowClickSelection: true,
      suppressCellSelection: true,
      animateRows: true,
      enableSorting: true,
      enableFilter: true
    };
  }

  onGridReady(params) {
    this.api = params.api;
    this.api.sizeColumnsToFit();
    //this.props.userTreeCsvData(params.api);
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
    }else if(this.props.dataList.length ===0) {
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

export default UserGroupResourceList;
