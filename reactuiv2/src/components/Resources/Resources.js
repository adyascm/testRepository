import React, { Component } from 'react';

import { Route, Switch, Redirect } from 'react-router-dom';

import { connect } from 'react-redux';
import { Grid, Container } from 'semantic-ui-react'

import {
  RESOURCES_PAGE_LOADED,
  RESOURCES_PAGE_UNLOADED
} from '../../constants/actionTypes';
import ResourcesTree from './ResourcesTree';
import ResourcePermissionSection from './ResourcePermissionSection';

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
  }

  render() {
    let containerStyle = {
      height: 450
    };
    return (
      <Grid stretched celled='internally'>
        <Grid.Row>
          <Grid.Column width={7}>
            <ResourcesTree />
          </Grid.Column>
          <Grid.Column width={9}>
            <Container fluid >
                <ResourcePermissionSection />
            </Container>
          </Grid.Column>
        </Grid.Row>
      </Grid>

    )
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(Users);