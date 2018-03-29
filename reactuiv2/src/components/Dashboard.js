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
      { id: "usersCount", header: "Users", footer: "", renderType: "SimpleNumberWidget", link: "/users?header='Users'" },
      { id: "groupsCount", header: "Groups", footer: "", renderType: "SimpleNumberWidget", link: "/users?header='Groups'" },
      { id: "filesCount", header: "Files", footer: "", renderType: "SimpleNumberWidget", link: "/resources?header='Files'" },
      { id: "foldersCount", header: "Folders", footer: "", renderType: "SimpleNumberWidget", link: "/resources?header='Folders'" },
    ];
    this.chartWidgetConfigs = [
      { id: "sharedDocsByType", header: "", footer: "Shared documents", renderType: "ChartWidget", link: "/resources" },
      { id: "userAppAccess", header: "", footer: "installed Apps", renderType: "ChartWidget", link: "/apps?header='Apps'" },
      { id: "filesWithFileType", header: "File Types", footer: "Files Exposed", renderType: "ChartWidget", link: "/resources" }
    ];
    this.gridWidgetConfigs = [
      { id: "externalUsersList", header: "External users with most access", renderType: "ListWidget", link: "/users" },
      {id: "internalUserList", header: "Domain users with most exposed documents", renderType: "ListWidget", link: "/users"}
    ];
  }

  componentDidMount() {
    // var index = 0;
    // for(index = 0; index < this.widgetConfigs.length; index++)
    // {
    //   this.props.onLoad(this.widgetConfigs[index].id, agent.Dashboard.getWidgetData(this.widgetConfigs[index].id));
    // }
  }

  render() {
    return (
      <Container fluid>
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
        <Card.Group itemsPerRow='4'>
          {
            this.simpleWidgetConfigs.map(config => {
              return (
                <SimpleNumberWidget key={config["id"]} config={config} />
              )
            })
          }
        </Card.Group>
      </Container>
    )
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(Dashboard);
