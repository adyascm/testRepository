import React, { Component } from 'react';

import { Route, Switch, Redirect } from 'react-router-dom';

import { connect } from 'react-redux';
import { Container, Dimmer, Loader, Grid, Divider, Checkbox, Sticky } from 'semantic-ui-react'

import agent from '../../utils/agent';
import UserActions from '../actions/UserActions'


import {
  USERS_PAGE_LOADED,
  USERS_PAGE_UNLOADED,
  USERS_PAGE_LOAD_START
} from '../../constants/actionTypes';
import UsersTree from './UsersTree';
import UserList from './UserList'
import UsersGroupsDetailsSection from './UsersGroupsDetailsSection';

const mapStateToProps = state => ({
  appName: state.common.appName,
  currentUser: state.common.currentUser
});

const mapDispatchToProps = dispatch => ({
  onLoad: (payload) =>
    dispatch({ type: USERS_PAGE_LOADED, payload }),
  onUnload: () =>
    dispatch({ type: USERS_PAGE_UNLOADED }),
  onLoadStart: () =>
    dispatch({ type: USERS_PAGE_LOAD_START }),
});

class Users extends Component {
  constructor(props) {
    super(props);
    this.state = {
      showHierarchy: false,
      showOnlyExternal: true
    }
  }
  toggleHierarchyView = () => {
    var showOnlyExternal = this.state.showOnlyExternal;
    if (!this.state.showHierarchy)
      showOnlyExternal = false;
    this.setState({
      ...this.state,
      showHierarchy: !this.state.showHierarchy,
      showOnlyExternal: showOnlyExternal
    });
  }

  toggleExternalUserView = () => {
    this.setState({
      ...this.state,
      showOnlyExternal: !this.state.showOnlyExternal
    });
  }

  componentWillMount() {
    this.props.onLoadStart();
    this.props.onLoad(agent.Users.getUsersTree());
  }
  handleContextRef = contextRef => this.setState({
    contextRef
  })

  render() {
    const { contextRef } = this.state
    let containerStyle = {
      height: "100%",
      textAlign: "left"
    };
    var gridWidth = 16;
    if (this.props.users.selectedUserItem) {
      gridWidth = 4;
    }
    if (this.props.isLoading) {
      return (
        <Container style={containerStyle}>
          <Dimmer active inverted>
            <Loader inverted content='Loading' />
          </Dimmer>
        </Container >
      )
    }
    else {
      var flatList = (<UserList showOnlyExternal={this.state.showOnlyExternal} />)
      var treeView = (<UsersTree showOnlyExternal={this.state.showOnlyExternal} />)
      return (
        <Container style={containerStyle}>
          <Grid divided='vertically' stretched>
            <Grid.Row >
              <Grid.Column stretched width="5">
                <Checkbox toggle
                  label='Show only external users'
                  onChange={this.toggleExternalUserView}
                  checked={this.state.showOnlyExternal}
                />
              </Grid.Column>
              <Grid.Column stretched width="5">
                <Checkbox toggle
                  label='Show groups tree'
                  onChange={this.toggleHierarchyView}
                  checked={this.state.showHierarchy}
                />
              </Grid.Column>
            </Grid.Row>

            <Grid.Row stretched>
              <Grid.Column stretched width={gridWidth}> 
                {!this.state.showHierarchy ? flatList : treeView}
              </Grid.Column>
              <Grid.Column width={16 - gridWidth}>
                <UsersGroupsDetailsSection />
              </Grid.Column>
            </Grid.Row>
          </Grid>
          <UserActions {...this.props.users}/>
        </Container >

      )
    }

  }
}

export default connect(mapStateToProps, mapDispatchToProps)(Users);