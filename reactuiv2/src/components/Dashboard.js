import React, { Component } from 'react';

import { connect } from 'react-redux';
import { Card, Container } from 'semantic-ui-react'

import {
  DASHBOARD_PAGE_LOADED,
  DASHBOARD_PAGE_UNLOADED
} from '../constants/actionTypes';

import SimpleNumberWidget from './Widgets/SimpleNumberWidget';
import ListWidget from './Widgets/ListWidget';
import ChartWidget from './Widgets/ChartWidget';

const mapStateToProps = state => ({
  appName: state.common.appName,
  currentUser: state.common.currentUser,
  ...state.dashboard
});

const mapDispatchToProps = dispatch => ({
  onLoad: (widgetId, payload) =>
    dispatch({ type: DASHBOARD_PAGE_LOADED, widgetId, payload }),
  onUnload: () =>
    dispatch({ type: DASHBOARD_PAGE_UNLOADED })
});

class Dashboard extends Component {
  constructor() {
    super();
    this.simpleWidgetConfigs = [
      { id: "usersCount", header: "Users", footer: "", renderType: "SimpleNumberWidget", link: "/users", states: {users: {userShowHierarchy: false, typeColumnFilterValue: ''}} },
      { id: "groupsCount", header: "Groups", footer: "", renderType: "SimpleNumberWidget", link: "/users" , states: {users: {userShowHierarchy: true, userFilterType: 'ALL'}} },
      { id: "filesCount", header: "Files", footer: "", renderType: "SimpleNumberWidget", link: "/resources" , states: {resources: {filterExposureType: '', filterResourceType: ''}} },
      { id: "foldersCount", header: "Folders", footer: "", renderType: "SimpleNumberWidget", link: "/resources", states: {resources: {filterExposureType: '', filterResourceType: 'folder'}}},
    ];
    this.chartWidgetConfigs = [
      { id: "sharedDocsByType", header: "", footer: "Shared documents", renderType: "ChartWidget", link: "/resources", states: {resources: {filterExposureType: 'EXT', filterResourceType: ''}}},
      { id: "userAppAccess", header: "", footer: "installed Apps", renderType: "ChartWidget", link: "/apps", states: {apps: {scopeExposure: 0}}},
      { id: "filesWithFileType", header: "File Types", footer: "Files Exposed", renderType: "ChartWidget", link: "/resources", states: {resources: {filterExposureType: 'EXT', filterResourceType: ''}}}
    ];
    this.gridWidgetConfigs = [
      { id: "externalUsersList", header: "External users with most access", renderType: "ListWidget", link: "/users", states: {users: {userShowHierarchy: false, typeColumnFilterValue: 'EXT'}}},
      {id: "internalUserList", header: "Users with most exposed documents", renderType: "ListWidget", link: "/users", states: {users: {userShowHierarchy: false, typeColumnFilterValue: 'INT'}}}
    ];
  }

  componentWillMount() {
    window.scrollTo(0, 0)
  }

  render() {
    return (
      <Container fluid>
      <Card.Group itemsPerRow='4'>
          {
            this.simpleWidgetConfigs.map(config => {
              return (
                <SimpleNumberWidget key={config["id"]} config={config} />
              )
            })
          }
        </Card.Group>
        <Card.Group itemsPerRow='3'>
          {
            this.chartWidgetConfigs.map(config => {
              return (
                <ChartWidget key={config["id"]} config={config} />
              )
            })
          }
        </Card.Group>
        <Card.Group itemsPerRow='2'>
          {
            this.gridWidgetConfigs.map(config => {
              return (
                <ListWidget key={config["id"]} config={config} />
              )
            })
          }
        </Card.Group>
      </Container>
    )
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(Dashboard);
