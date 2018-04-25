import React, { Component } from 'react';

import { connect } from 'react-redux';
import { Container, Dimmer, Loader, Grid, Checkbox } from 'semantic-ui-react'

import agent from '../../utils/agent';
import Actions from '../actions/Actions'


import {
  USERS_PAGE_UNLOADED,
  USER_ITEM_SELECTED
} from '../../constants/actionTypes';

import UsersTree from './UsersTree';
import UserList from './UserList'
import UsersGroupsDetailsSection from './UsersGroupsDetailsSection';
import Dropdown from 'semantic-ui-react/dist/commonjs/modules/Dropdown/Dropdown';

const mapStateToProps = state => ({
  appName: state.common.appName,
  currentUser: state.common.currentUser,
  selectedUser: state.users.selectedUserItem,
  isLoading: state.users.isLoadingUsers,
  userPayload: state.users.usersTreePayload,
  userFilterType: state.users.userFilterType,
  userShowHierarchy: state.users.userShowHierarchy,
  hasGroups: state.users.hasGroups,
  selectedUserItem: state.users.selectedUserItem
});

const mapDispatchToProps = dispatch => ({
  onUnload: () =>
    dispatch({ type: USERS_PAGE_UNLOADED }),
  selectUserItem: (payload) =>
    dispatch({ type: USER_ITEM_SELECTED, payload })
});

class Users extends Component {
  constructor(props) {
    super(props);
    this.state = {
      showHierarchy: this.props.userShowHierarchy,
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
    this.props.selectUserItem(undefined)
    this.setState({
      ...this.state,
      showHierarchy: !this.state.showHierarchy
    });
  }

  componentWillMount() {
    window.scrollTo(0, 0)
    this.props.selectUserItem(undefined)
  }

  handleContextRef = contextRef => this.setState({
    contextRef
  })

  handleUserFilterChange = (event, data) => {
    this.setState({
      showMemberType: data.value
    })
    this.props.selectUserItem(undefined)
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

    let toggleCheckbox = (
      <Checkbox toggle
        label='Show groups tree'
        onChange={this.toggleHierarchyView}
        checked={this.state.showHierarchy}
      />
    )

    let dimmer = (<Dimmer active inverted><Loader inverted content='Loading' /></Dimmer>)
    var flatList = (<UserList showMemberType={this.state.showMemberType} />)
    var treeView = (<UsersTree showMemberType={this.state.showMemberType} />)

    if (this.props.isLoading)
      return (
        <Dimmer active inverted><Loader inverted content='Loading' /></Dimmer>
      )
    else if (this.props.userPayload)
      return (
        <Container style={containerStyle}>
          
          <Grid divided='vertically' stretched>
            <Grid.Row >
              <Grid.Column stretched width="5">
                <Dropdown
                  options={this.state.usersFilter}
                  selection
                  defaultValue={this.state.showMemberType}
                  onChange={this.handleUserFilterChange}
                />
              </Grid.Column>
              <Grid.Column stretched floated='right' width="5">
                {this.props.hasGroups ? toggleCheckbox : null}
              </Grid.Column>
            </Grid.Row>

            <Grid.Row stretched>
              <Grid.Column stretched width={gridWidth}>
                {/* {!this.props.userPayload && this.props.isLoading ? dimmer : null} */}
                {!this.state.showHierarchy ? flatList : treeView}
              </Grid.Column>
              {
                this.props.selectedUserItem ?
                  (<Grid.Column width='12'>
                    <UsersGroupsDetailsSection {...this.props.selectedUserItem} />
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
    else 
      return (
        <div>
          There are no users to display
        </div>
      )
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(Users);