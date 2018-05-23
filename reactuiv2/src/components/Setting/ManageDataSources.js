import React, { Component } from 'react';
import { connect } from 'react-redux';
import agent from '../../utils/agent';
import { Card, Button, Container, Header, Divider } from 'semantic-ui-react'


import {
  SET_DATASOURCES,
  CREATE_DATASOURCE,
  DELETE_DATASOURCE_START,
  LOGIN_START,
  LOGIN_ERROR,
  DATASOURCE_LOAD_START,
  DATASOURCE_LOAD_END,
  ASYNC_END,
  SET_REDIRECT_PROPS
} from '../../constants/actionTypes';
import GsuiteDataSourceItem from './GsuiteDataSourceItem';
import SlackDataSourceItem from './SlackDataSourceItem';

const mapStateToProps = state => ({
  ...state.auth,
  appName: state.common.appName,
  currentUser: state.common.currentUser,
  dataSources: state.common.dataSources,
  errorMessage: state.common.errMessage,
  datasourceLoading: state.common.datasourceLoading,
  currentUrl: state.common.currentUrl
});

const mapDispatchToProps = dispatch => ({
  setDataSources: (datasources) =>
    dispatch({ type: SET_DATASOURCES, payload: datasources }),
  onDataSourceLoad: () =>
    dispatch({ type: DATASOURCE_LOAD_START }),
  displayErrorMessage: (error) => {
    dispatch({ type: DATASOURCE_LOAD_END }),
      dispatch({ type: ASYNC_END, errors: error.message ? error.message : error['Failed'] })
  }
});

class ManageDataSources extends Component {
  componentWillMount() {
    window.scrollTo(0, 0)
    if (!this.props.common.datasources)
      this.props.setDataSources(agent.Setting.getDataSources());
  }

  render() {
    if (this.props.currentUser.is_serviceaccount_enabled && !this.props.currentUser.is_admin) {
      return (
        <Container>
          You are not authorized to manage datasources. Please contact your administrator.
          </Container>
      )
    }

    let connectedSourcesMap = {}
    let ds = this.props.common.datasources && this.props.common.datasources.map(ds => {
      connectedSourcesMap[ds.datasource_type] = ds;
    });

    let connectedSources = [];
    let disconnectedSources = [];
    if (connectedSourcesMap["GSUITE"]) {
      connectedSources.push(<GsuiteDataSourceItem key={1} item={connectedSourcesMap["GSUITE"]} is_serviceaccount_enabled={this.props.currentUser.is_serviceaccount_enabled} />)
    }
    else {
      disconnectedSources.push(<GsuiteDataSourceItem key={1} item={undefined} is_serviceaccount_enabled={this.props.currentUser.is_serviceaccount_enabled} />)
    }

    if (connectedSourcesMap["SLACK"]) {
      connectedSources.push(<SlackDataSourceItem key={2} item={connectedSourcesMap["SLACK"]} />)
    }
    else {
      disconnectedSources.push(<SlackDataSourceItem key={2} item={undefined} />)
    }
    let moreConnectors = null;
    if (disconnectedSources.length > 0) {
      moreConnectors = (
        <div>
          <Divider horizontal>Available Connectors</Divider>
          <Card.Group itemsPerRow='1'>
            {disconnectedSources}
          </Card.Group>
        </div>);
    }
    return (
      <Container>
        <Card.Group itemsPerRow='1'>
          {connectedSources}
        </Card.Group>
        {moreConnectors}
      </Container>
    )
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(ManageDataSources);
