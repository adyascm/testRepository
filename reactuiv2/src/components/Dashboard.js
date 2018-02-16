import React, { Component } from 'react';

import { Route, Switch, Redirect } from 'react-router-dom';

import { connect } from 'react-redux';
import { Card } from 'semantic-ui-react'

import agent from '../utils/agent';

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
    this.widgetConfigs = [
      { id: "usersCount", header: "Users", footer: "", renderType: "SimpleNumberWidget" },
      { id: "groupsCount", header: "Groups", footer: "", renderType: "SimpleNumberWidget" },
      { id: "filesCount", header: "Files", footer: "", renderType: "SimpleNumberWidget" },
      { id: "foldersCount", header: "Folders", footer: "", renderType: "SimpleNumberWidget" },
      { id: "sharedDocsByType", header: "", footer: "Shared docs", renderType: "ChartWidget" },
      { id: "sharedDocsList", header: "Top 5 visible docs", renderType: "ListWidget" },
      { id: "externalUsersList", header: "Top 5 external users", renderType: "ListWidget" },
    ];
  }

  componentWillMount() {
    // var index = 0;
    // for(index = 0; index < this.widgetConfigs.length; index++)
    // {
    //   this.props.onLoad(this.widgetConfigs[index].id, agent.Dashboard.getWidgetData(this.widgetConfigs[index].id));
    // }
  }

  render() {
    return (
      
      <Card.Group stackable>
        {
          this.widgetConfigs.map(config => {
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
    )
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(Dashboard);