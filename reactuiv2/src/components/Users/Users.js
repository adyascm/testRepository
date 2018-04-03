import React, { Component } from 'react';

import { connect } from 'react-redux';
import { Container, Dimmer, Loader, Grid, Checkbox } from 'semantic-ui-react'

import agent from '../../utils/agent';
import Actions from '../actions/Actions'


import {
  USERS_PAGE_UNLOADED,
  FLAG_ERROR_MESSAGE
} from '../../constants/actionTypes';

import UsersTree from './UsersTree';
import UserList from './UserList'
import UsersGroupsDetailsSection from './UsersGroupsDetailsSection';
import Dropdown from 'semantic-ui-react/dist/commonjs/modules/Dropdown/Dropdown';

const mapStateToProps = state => ({
  appName: state.common.appName,
  currentUser: state.common.currentUser,
  selectedUser: state.users.selectedUserItem,
  isLoading: state.users.isLoading,
  userPayload: state.users.usersTreePayload,
  userFilterType: state.users.userFilterType,
  userShowHierarchy: state.users.userShowHierarchy
});

const mapDispatchToProps = dispatch => ({
  onUnload: () =>
    dispatch({ type: USERS_PAGE_UNLOADED }),
  flagUsersError: (error, info) =>
    dispatch({ type: FLAG_ERROR_MESSAGE, error, info })
});

class Users extends Component {
  constructor(props) {
    super(props);
    this.state = {
      showHierarchy: this.props.userShowHierarchy,
      usersEmpty: false,
      usersFilter: [
        {
          text: 'External Users',
          value: 'EXT'
        },
        {
          text: 'Internal Users',
          value: 'DOMAIN'
        },
        {
          text: 'All Users',
          value: 'ALL'
        }
      ],
      showMemberType: this.props.userFilterType
    }
  }
  toggleHierarchyView = () => {
    this.setState({
      ...this.state,
      showHierarchy: !this.state.showHierarchy
    });
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.selectedUser && (nextProps.selectedUser["member_type"] !== 'EXT')  && this.state.showMemberType === 'EXT')
      this.setState({
        showMemberType: 'ALL'
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

  handleUserFilterChange = (event, data) => {
    console.log("event value : ", data.value)
    if (data.value === 'EXT')
      this.setState({
        showMemberType: 'EXT'
      })
    else if (data.value === 'ALL')
      this.setState({
        showMemberType: 'ALL'
      })
    else if (data.value === 'DOMAIN')
      this.setState({
        showMemberType: 'DOMAIN'
      })
  }

  render() {
    let containerStyle = {
      height: "100%",
      textAlign: "left"
    };

    var gridWidth = 16;

    if (this.props.users.selectedUserItem) {
      gridWidth = 4;
    }
    let dimmer = (<Dimmer active inverted><Loader inverted content='Loading' /></Dimmer>)
    var flatList = (<UserList showMemberType={this.state.showMemberType} />)
    var treeView = (<UsersTree showMemberType={this.state.showMemberType} />)
    return (
      <Container style={containerStyle}>
        
        <Grid divided='vertically' stretched>
          <Grid.Row >
            <Grid.Column stretched width="5">
              <Dropdown
                options={this.state.usersFilter}
                selection
                defaultValue='EXT'
                onChange={this.handleUserFilterChange}
              />
            </Grid.Column>
            <Grid.Column stretched floated='right' width="5">
              <Checkbox toggle
                label='Show groups tree'
                onChange={this.toggleHierarchyView}
                checked={this.state.showHierarchy}
              />
            </Grid.Column>
          </Grid.Row>

          <Grid.Row stretched>
            <Grid.Column stretched width={gridWidth}>
              {!this.props.userPayload && this.props.isLoading ? dimmer : null}
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