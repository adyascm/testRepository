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
import UserListNew from './UserListNew'
import UsersGroupsDetailsSection from './UsersGroupsDetailsSection';
import Dropdown from 'semantic-ui-react/dist/commonjs/modules/Dropdown/Dropdown';

const mapStateToProps = state => ({
  selectedUserItem: state.users.selectedUserItem
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
      textAlign: "left"
    };

    var gridWidth = 16;

    if (this.props.selectedUserItem) {
      gridWidth = 4;
    }

    return (
        <Container fluid style={containerStyle}>
            <Grid divided='vertically' stretched>
            <Grid.Row stretched>
                <Grid.Column stretched width={gridWidth}>
                    <UserListNew />
                </Grid.Column>
                {
                this.props.selectedUserItem ?
                    (<Grid.Column width='12'>
                    <UsersGroupsDetailsSection {...this.props.selectedUserItem} />
                    </Grid.Column>) : null
                }
            </Grid.Row>
            </Grid>
            <Actions />
        </Container >
    )
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(UsersNew);
