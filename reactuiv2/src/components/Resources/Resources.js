import React, { Component } from 'react';

import { Route, Switch, Redirect } from 'react-router-dom';

import { connect } from 'react-redux';
import { Grid, Image, Tab, Container } from 'semantic-ui-react'
import { Grid as TreeGrid } from 'react-redux-grid';

import { AgGridReact } from "ag-grid-react";
import 'ag-grid/dist/styles/ag-grid.css';
import 'ag-grid/dist/styles/ag-theme-fresh.css';

import {
  RESOURCES_PAGE_LOADED,
  RESOURCES_PAGE_UNLOADED
} from '../../constants/actionTypes';
import ResourcePermissions from './ResourcePermissions';

const mapStateToProps = state => ({
  appName: state.common.appName,
  currentUser: state.common.currentUser
});

const mapDispatchToProps = dispatch => ({
  onLoad: (tab, pager, payload) =>
    dispatch({ type: RESOURCES_PAGE_LOADED, tab, pager, payload }),
  onUnload: () =>
    dispatch({ type: RESOURCES_PAGE_UNLOADED })
});

class Users extends Component {
  constructor(props) {
    super(props);
    this.treeConfig = {
      stateful: false,
      stateKey: 'tree-grid-1',
      gridType: 'tree', // either `tree` or `grid`,
      showTreeRootNode: true, // dont display root node of tree
      columns: [
        {
          dataIndex: 'category',
          name: 'Category',
          expandable: true // this will be the column that shows the nested hierarchy
        }
      ],
      plugins: {},
    };
    this.treeData = { root: { id: 1, parentId: -1, category: 'Category 1', children: [{ id: 2, parentId: 1, category: 'Category 2', children: [] }] } }, { id: 3, parentId: -1, category: 'Category 1', children: [{ id: 4, parentId: 3, category: 'Category 2', children: [] }] };

    this.state = {
      columnDefs: [
        {
            headerName: "Resource",
            field: "group",
            cellRenderer: "agGroupCellRenderer"
        },
        {
            headerName: "Owner",
            field: "owner"
        }
    ],
    rowData: [
        {
            group: "Folder A",
            owner: "amit@adya.io",
            permission: "write",
            participants: [
                {
                    group: "A.1",
                    owner: "amit@adya.io",
            permission: "write",
                },
                {
                    group: "A.2",
                    owner: "tinkesh@adya.io",
            permission: "read",
                },
                {
                    group: "A.3",
                    owner: "rashmi@adya.io",
            permission: "write",
                }
            ]
        },
        {
            group: "Folder B",
            owner: "deepak@adya.io",
            permission: "read",
            participants: [
                {
                    group: "B.1",
                    owner: "amit@adya.io",
            permission: "read",
                },
                {
                    group: "B.2",
                    owner: "tinkesh@adya.io",
            permission: "read",
                },
                {
                    group: "B.3",
                    owner: "amit@adya.io",
            permission: "write",
                },
                {
                    group: "B.4",
                    owner: "abhra@adya.io",
            permission: "write",
                },
                {
                    group: "B.5",
                    owner: "amit@adya.io",
            permission: "write",
                }
            ]
        },
        {
            group: "Folder C",
            owner: "amit@adya.io",
            permission: "write",
            participants: [
                {
                    group: "C.1",
                    owner: "amit@adya.io",
            permission: "write",
                },
                {
                    group: "C.2",
                    owner: "deepak@adya.io",
            permission: "read",
                }
            ]
        }
    ],
    getNodeChildDetails: function getNodeChildDetails(rowItem) {
        if (rowItem.participants) {
            return {
                group: true,
                expanded: false,
                children: rowItem.participants,
                key: rowItem.group
            };
        } else {
            return null;
        }
    }
    };

    this.panes = [
      { menuItem: 'Permissions', render: () => <Tab.Pane attached={false}><ResourcePermissions /></Tab.Pane> },
      
    ];
  }
  onGridReady(params) {
    this.gridApi = params.api;
    this.gridColumnApi = params.columnApi;

    params.api.sizeColumnsToFit();
  }
  render() {
    let containerStyle = {
      height: 450
    };
    return (
      <Grid stretched celled='internally'>
        <Grid.Row>
          <Grid.Column width={7}>
            {/* <TreeGrid { ...this.treeConfig } data={this.treeData}/> */}
            <div className="ag-theme-fresh">
              <AgGridReact
                id="myGrid" domLayout="autoHeight"
                rowSelection='single' suppressCellSelection='true'
                columnDefs={this.state.columnDefs}
                rowData={this.state.rowData}
                getNodeChildDetails={this.state.getNodeChildDetails}
                onGridReady={this.onGridReady.bind(this)}
              />
            </div>
          </Grid.Column>
          <Grid.Column width={9}>
          <Container fluid >
          <Tab menu={{ secondary: true, pointing: true }} panes={this.panes} />
</Container>
          </Grid.Column>
        </Grid.Row>
      </Grid>

    )
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(Users);