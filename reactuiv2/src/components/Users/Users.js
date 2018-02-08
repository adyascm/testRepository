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
import UsersTree from './UsersTree';

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

    this.panes = [
      { menuItem: 'Details', render: () => <Tab.Pane attached={false}><UserDetails /></Tab.Pane> },
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
            <UsersTree />
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