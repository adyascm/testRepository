import React, { Component } from 'react';

import { Route, Switch, Redirect } from 'react-router-dom';

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
  currentUser: state.common.currentUser
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
      { id: "usersCount", header: "Users", footer: "", renderType: "SimpleNumberWidget", link: "/users" },
      { id: "groupsCount", header: "Groups", footer: "", renderType: "SimpleNumberWidget", link: "/users" },
      { id: "filesCount", header: "Files", footer: "", renderType: "SimpleNumberWidget", link: "/resources" },
      { id: "foldersCount", header: "Folders", footer: "", renderType: "SimpleNumberWidget", link: "/resources" },
    ];
    this.chartWidgetConfigs = [
      { id: "sharedDocsByType", header: "", footer: "Shared docs", renderType: "ChartWidget", link: "/resources" },
      { id: "sharedDocsList", header: "Exposed docs", renderType: "ListWidget", link: "/resources" },
      { id: "externalUsersList", header: "External users", renderType: "ListWidget", link: "/users" },
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
      <Container>
        <Card.Group itemsPerRow='4'>
          {
            this.simpleWidgetConfigs.map(config => {
              var widget = null;
              if (config.renderType === "SimpleNumberWidget")
                widget = <SimpleNumberWidget config={config} />
              else if (config.renderType === "ChartWidget")
                widget = <ChartWidget config={config} />
              else
                widget = <ListWidget config={config} />

              return (
                widget
              )
            })
          }
        </Card.Group>
        <Card.Group itemsPerRow='3'>
          {
            this.chartWidgetConfigs.map(config => {
              var widget = null;
              if (config.renderType === "SimpleNumberWidget")
                widget = <SimpleNumberWidget config={config} />
              else if (config.renderType === "ChartWidget")
                widget = <ChartWidget config={config} />
              else
                widget = <ListWidget config={config} />

              return (
                widget
              )
            })
          }
        </Card.Group>
      </Container>
    )
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(Dashboard);
