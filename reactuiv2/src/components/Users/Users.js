import React, { Component } from 'react';

import { connect } from 'react-redux';
import { Container, Dimmer, Loader, Grid, Checkbox } from 'semantic-ui-react'

import agent from '../../utils/agent';
import Actions from '../actions/Actions'


import {
  USERS_PAGE_LOADED,
  USERS_PAGE_UNLOADED,
  USERS_PAGE_LOAD_START,
  ADD_APP_MESSAGE
} from '../../constants/actionTypes';

import UsersTree from './UsersTree';
import UserList from './UserList'
import UsersGroupsDetailsSection from './UsersGroupsDetailsSection';

const mapStateToProps = state => ({
  appName: state.common.appName,
  currentUser: state.common.currentUser,
  selectedUser: state.users.selectedUserItem,
  isLoading: state.users.isLoading,
  userPayload: state.users.usersTreePayload
});

const mapDispatchToProps = dispatch => ({
  onLoad: (payload) =>
    dispatch({ type: USERS_PAGE_LOADED, payload }),
  onUnload: () =>
    dispatch({ type: USERS_PAGE_UNLOADED }),
  onLoadStart: () =>
    dispatch({ type: USERS_PAGE_LOAD_START }),
  flagUsersError: (error, info) =>
    dispatch({ type: ADD_APP_MESSAGE, error, info })
});

class Users extends Component {
  constructor(props) {
    super(props);
    this.state = {
      showHierarchy: false,
      showOnlyExternal: true,
      usersEmpty: false
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
    if (this.props.location.search.includes("Users"))
      this.setState({
        showOnlyExternal: false
      })
    else if (this.props.location.search.includes("Groups"))
      this.setState({
        showHierarchy: true,
        showOnlyExternal: false
      })

    this.props.onLoadStart();
    this.props.onLoad(agent.Users.getUsersTree());
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.selectedUser && (nextProps.selectedUser["member_type"] !== 'EXT') && this.state.showOnlyExternal)
      this.setState({
        showOnlyExternal: false
      })

    if (nextProps.userPayload && nextProps.userPayload.length === 0 && !this.state.usersEmpty) {
      this.props.flagUsersError("There are no users to display", undefined)
      this.setState({
        usersEmpty: true
      })
    }
  }

  handleContextRef = contextRef => this.setState({
    contextRef
  })

  render() {
    //const { contextRef } = this.state
    let containerStyle = {
      height: "100%",
      textAlign: "left"
    };

    var gridWidth = 16;

    if (this.props.users.selectedUserItem) {
      gridWidth = 4;
    }
    let dimmer = (<Dimmer active inverted><Loader inverted content='Loading' /></Dimmer>)
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
              {this.props.isLoading ? dimmer : null}
              {!this.state.showHierarchy ? flatList : treeView}
            </Grid.Column>
            {
              this.props.users.selectedUserItem ?
                (<Grid.Column width='12'>
                  <UsersGroupsDetailsSection {...this.props.users.selectedUserItem} />
                </Grid.Column>) : null
            }
            {/* <Grid.Column width={16 - gridWidth}>
                <UsersGroupsDetailsSection {...this.props.users.selectedUserItem}/>
              </Grid.Column> */}
          </Grid.Row>
        </Grid>
        <Actions />
      </Container >
    )
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(Users);