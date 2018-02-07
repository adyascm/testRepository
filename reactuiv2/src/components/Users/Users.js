import React, { Component } from 'react';

import { Route, Switch, Redirect } from 'react-router-dom';

import { connect } from 'react-redux';
import { Grid, Image, Tab, Container } from 'semantic-ui-react'

import { AgGridReact } from "ag-grid-react";
import 'ag-grid/dist/styles/ag-grid.css';
import 'ag-grid/dist/styles/ag-theme-fresh.css';

import {
  USERS_PAGE_LOADED,
  USERS_PAGE_UNLOADED
} from '../../constants/actionTypes';
import UserAccess from './UserAccess';
import UserDetails from './UserDetails';
import UserGroupCell from './UserGroupCell';

const mapStateToProps = state => ({
  appName: state.common.appName,
  currentUser: state.common.currentUser
});

const mapDispatchToProps = dispatch => ({
  onLoad: (tab, pager, payload) =>
    dispatch({ type: USERS_PAGE_LOADED, tab, pager, payload }),
  onUnload: () =>
    dispatch({ type: USERS_PAGE_UNLOADED })
});

class Users extends Component {
  constructor(props) {
    super(props);
    this.onCellRowClicked = this.onCellRowClicked.bind(this);
    
    this.state = {
      columnDefs: [
        {
          headerName: "Group",
          field: "group",
          //cellRenderer: "agGroupCellRenderer",
          cellRenderer: "userGroupCell"
        },
        {
          headerName: "Last Active",
          field: "last_active",
        }
      ],
      rowData: [
        {
          group: "Group A",
          participants: [
            {
              group: "A.1",
              last_active: "10 mins",
            },
            {
              group: "A.2",
              last_active: "10 mins",
            },
            {
              group: "A.3",
              last_active: "10 mins",
            }
          ]
        },
        {
          group: "Group B",
          last_active: "10 mins",
          participants: [
            {
              group: "B.1",
              last_active: "10 mins",
            },
            {
              group: "B.2",
              last_active: "10 mins",
            },
            {
              group: "B.3",
              last_active: "10 mins",
            },
            {
              group: "B.4",
              last_active: "10 mins",
            },
            {
              group: "B.5",
              last_active: "10 mins",
            }
          ]
        },
        {
          group: "Group C",
          last_active: "10 mins",
          participants: [
            {
              group: "C.1",
              last_active: "10 mins",
            },
            {
              group: "C.2",
              last_active: "10 mins",
            }
          ]
        }
      ],
      // getNodeChildDetails: function getNodeChildDetails(rowItem) {
      //   if (rowItem.participants) {
      //     return {
      //       group: true,
      //       expanded: rowItem.group === "Group C",
      //       children: rowItem.participants,
      //       key: rowItem.group
      //     };
      //   } else {
      //     return null;
      //   }
      // },
      cellRowData: '',
      frameworkComponents: {
        userGroupCell: UserGroupCell
      }
    };

    this.panes = [
      { menuItem: 'Details', render: () => <Tab.Pane attached={false}><UserDetails cellRowData={this.state.cellRowData} /></Tab.Pane> },
      { menuItem: 'Resources', render: () => <Tab.Pane attached={false}><UserAccess /></Tab.Pane> },
      { menuItem: 'Activity', render: () => <Tab.Pane attached={false}>Get all activities from google</Tab.Pane> },
      
    ];

    this.gridOptions = {
      onRowClicked: this.onCellRowClicked
    }
  }

  onGridReady(params) {
    this.gridApi = params.api;
    this.gridColumnApi = params.columnApi;

    params.api.sizeColumnsToFit();
  }

  onCellRowClicked(params) {
    console.log("cell row click data : ", params.data)
    this.setState({
      cellRowData: params.data
    })
  }

  render() {
    let containerStyle = {
      height: "100%"
    };
    return (
      <Grid stretched celled='internally'>
        <Grid.Row style={{height:'500px'}}>
          <Grid.Column width={7}>
            <div className="ag-theme-fresh"> 
              <AgGridReact
                id="myGrid" domLayout="autoHeight"
                columnDefs={this.state.columnDefs}
                rowData={this.state.rowData}
                getNodeChildDetails={this.state.getNodeChildDetails}
                onGridReady={this.onGridReady.bind(this)}
                gridOptions={this.gridOptions}
                frameworkComponents={this.state.frameworkComponents}
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