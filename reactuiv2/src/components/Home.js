import React, { Component } from 'react';
import '../App.css';
import { Route, Switch, Redirect } from 'react-router-dom';

import { connect } from 'react-redux';
import { Card } from 'semantic-ui-react'

import {
  HOME_PAGE_LOADED,
  HOME_PAGE_UNLOADED
} from '../constants/actionTypes';
import SimpleNumberWidget from './Widgets/SimpleNumberWidget';
import ListWidget from './Widgets/ListWidget';
import ChartWidget from './Widgets/ChartWidget';

const mapStateToProps = state => ({
  ...state.home,
  appName: state.common.appName,
  currentUser: state.common.currentUser
});

const mapDispatchToProps = dispatch => ({
  onLoad: (tab, pager, payload) =>
    dispatch({ type: HOME_PAGE_LOADED, tab, pager, payload }),
  onUnload: () =>
    dispatch({ type: HOME_PAGE_UNLOADED })
});

class Home extends Component {
  constructor(){
    super();
     this.externalSharedRows = [{'name':'UX Workflow.pdf', 'last_accessed':'10 mins ago'},{'name':'Important.txt', 'last_accessed':'2 hours ago'},{'name':'AdyaPresentation.ppt', 'last_accessed':'5 hours ago'},{'name':'Architecture.pdf', 'last_accessed':'10 hours ago'}];
    this.externalSharedCols = ['name', 'last_accessed'];
    this.externalSharedFooter = "4 external shared documents";

    this.externalUsersRows = [{'email':'satya@microsoft.com', 'last_active':'4 hours ago'},{'email':'jeff.bezos@amazon.com', 'last_active':'3 weeks ago'}];
    this.externalUsersCols = ['email', 'last_active'];
    this.externalUsersFooter = "2 external users";

    this.sharedDocsRows = {'Public': 5,'External': 2, 'Domain': 53}
  }


  render() {
    return (
      <Card.Group>
        <SimpleNumberWidget header="Users" value="430"/>
        <SimpleNumberWidget header="Groups" value="54"/>
        <SimpleNumberWidget header="Files" value="10,231"/>
        <SimpleNumberWidget header="Folders" value="41"/>
        <ChartWidget footer="60 shared docs" rows={this.sharedDocsRows}/>
        <ListWidget header="Last Accessed" rows={this.externalSharedRows} cols={this.externalSharedCols} footer={this.externalSharedFooter} />
        <ListWidget header="Last Active" rows={this.externalUsersRows} cols={this.externalUsersCols} footer={this.externalSharedFooter} />
      </Card.Group>
    )
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(Home);