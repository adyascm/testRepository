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
import UsersTree from './UsersTree';
import UsersGroupsDetailsSection from './UsersGroupsDetailsSection';

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
  }

  onGridReady(params) {
    this.gridApi = params.api;
    this.gridColumnApi = params.columnApi;

    params.api.sizeColumnsToFit();
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
              <UsersGroupsDetailsSection />
            </Container>
          </Grid.Column>
        </Grid.Row>
      </Grid>
    )
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(Users);