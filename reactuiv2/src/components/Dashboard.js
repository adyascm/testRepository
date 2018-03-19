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
      { id: "sharedDocsByType", header: "", footer: "Shared documents", renderType: "ChartWidget", link:"/resources" },
      { id: "userAppAccess", header: "",footer: "installed Apps", renderType: "ChartWidget", link:"/apps?header='Apps'"  },
      { id: "sharedDocsList", header: "Exposed documents", renderType: "ListWidget", link:"/resources"  },
      { id: "externalUsersList", header: "External users", renderType: "ListWidget", link:"/users"  },
      {id: "filesWithFileType", header: "File Types",footer: "Files Exposed", renderType: "ChartWidget", link:"/resources"}
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
    var itemsPerRow = 2

    if (this.props.dashboard["userAppAccess"] && this.props.dashboard["userAppAccess"]["data"] && this.props.dashboard["userAppAccess"]["data"]["totalCount"] === 0) {
      itemsPerRow = 3
    }

    return (
      <Container>
      <Card.Group itemsPerRow='4'>
        {
          this.simpleWidgetConfigs.map(config => {
            var widget = null;
            if (config.renderType === "SimpleNumberWidget")
              widget = <SimpleNumberWidget key={config["id"]} config={config} />
            else if (config.renderType === "ChartWidget")
              widget = <ChartWidget key={config["id"]} config={config} />
            else
              widget = <ListWidget key={config["id"]} config={config} />

            return (
              widget
            )
          })
        }
      </Card.Group>
      <Card.Group itemsPerRow={itemsPerRow}>
        {
          this.chartWidgetConfigs.map(config => {
            var widget = null;
            if (config.renderType === "SimpleNumberWidget")
              widget = <SimpleNumberWidget key={config["id"]} config={config} />
            else if (config.renderType === "ChartWidget")
              widget = <ChartWidget key={config["id"]} config={config} />
            else
              widget = <ListWidget key={config["id"]} config={config} />

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
