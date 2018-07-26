import React, { Component } from 'react';

import { connect } from 'react-redux';
import { Container, Dimmer, Loader, Grid, Checkbox, Button, Modal, Header } from 'semantic-ui-react'

import agent from '../../utils/agent';
import Actions from '../actions/Actions'

import {
  USERS_PAGE_UNLOADED,
  USER_ITEM_SELECTED
} from '../../constants/actionTypes';

import UsersTree from './UsersTree';
import UserListNew from './UserListNew'
import UsersDetails from './UsersDetails';
import GroupsDetails from './GroupsDetails';

import Dropdown from 'semantic-ui-react/dist/commonjs/modules/Dropdown/Dropdown';

const mapStateToProps = state => ({
  selectedUserItem: state.users.selectedUserItem,
  ...state.users
});

const mapDispatchToProps = dispatch => ({
  selectUserItem: (payload) =>
    dispatch({ type: USER_ITEM_SELECTED, payload })
});

class UsersNew extends Component {
  constructor(props) {
    super(props);
  }

  componentWillMount() {
    window.scrollTo(0, 0)
    this.props.selectUserItem(undefined)
  }

  render() {
    let containerStyle = {
      height: "100%",
    };

    var gridWidth = 16;

    if (this.props.selectedUserItem) {
      gridWidth = 5;
    }

    let detailsSection = null;
    if (this.props.selectedUserItem) {
      if (this.props.selectedUserItem.type == "USER") {
        detailsSection = (<Grid.Column width='11'><UsersDetails {...this.props.selectedUserItem} /></Grid.Column>);
      }

      else {
        detailsSection = (<Grid.Column width='11'><GroupsDetails {...this.props.selectedUserItem} /></Grid.Column>);
      }
    }

    return (
      <div style={containerStyle}>
        <Grid divided='vertically'>
          <Grid.Row>
            <Grid.Column fluid width={gridWidth}>
              <UserListNew />
            </Grid.Column>
            {detailsSection}
          </Grid.Row>
        </Grid>
        <Actions />
      </div >
    )
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(UsersNew);
