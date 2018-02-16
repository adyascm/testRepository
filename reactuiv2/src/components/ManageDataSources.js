import React, { Component } from 'react';
import '../App.css';
import { Route, Switch, Redirect } from 'react-router-dom';
import { connect } from 'react-redux';
import agent from '../utils/agent';
import authenticate from '../utils/oauth';
import { Card, Button, Form, Container } from 'semantic-ui-react'
import Realtime from 'realtime-messaging';


import {
  API_ROOT,
  SET_DATASOURCES,
  CREATE_DATASOURCE,
  DASHBOARD_PAGE_LOADED,
  DASHBOARD_PAGE_UNLOADED,
  SCAN_UPDATE_RECEIVED
} from '../constants/actionTypes';
import DataSourceItem from './DataSourceItem';

const mapStateToProps = state => ({
  appName: state.common.appName,
  currentUser: state.common.currentUser,
  dataSources: state.common.dataSources
});

const mapDispatchToProps = dispatch => ({
  setDataSources: (datasources) =>
    dispatch({ type: SET_DATASOURCES, payload: datasources }),
  addDataSource: (name) => {
    dispatch({ type: CREATE_DATASOURCE, payload: agent.Setting.createDataSource({ "display_name": name }) })
  },
  onPushNotification: (actionType, msg) => {
    dispatch({ type: actionType, payload: msg })
  }

});

class ManageDataSources extends Component {
  constructor() {
    super();
    this.addNewDatasource = () => ev => {
      ev.preventDefault();
      authenticate("drive_scan_scope").then(data => this.props.addDataSource("Testing")).catch(({ errors }) => { this.props.onSignInError(errors) });
    };
    this.deleteDataSource = (datasource) => {
      datasource.isDeleting = true;
      agent.Setting.deleteDataSource(datasource).then(res => {
        this.props.setDataSources(agent.Setting.getDataSources())
      });
    };
  }
  componentWillMount() {
    if (!this.props.common.dataSources)
      this.props.setDataSources(agent.Setting.getDataSources());
    this.newDataSourceName = "";
    this.changeField = value => { this.newDataSourceName = value; }
  }
  render() {
    if (!this.props.common.datasources || !this.props.common.datasources.length) {
      return (
        <Container>
          <Card.Group>
            <Card fluid>
              <Card.Content>
                <Card.Description>
                  No datasource connected yet, please click below to start scanning your Google Suite...
                      </Card.Description>
              </Card.Content>
              <Card.Content extra>
                <div className='ui buttons'>
                  <Button basic color='green' disabled={this.newDataSourceName} onClick={this.addNewDatasource()}>Scan</Button>
                </div>
              </Card.Content>
            </Card>
          </Card.Group>
        </Container>
      )
    }
    else {
      return (
        <Container>
          <Card.Group>
            {
              this.props.common.datasources && this.props.common.datasources.map(ds => {
                return (
                  <DataSourceItem item={ds} onDelete={this.deleteDataSource} />
                )
              })
            }
          </Card.Group>
        </Container>
      )
    }
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(ManageDataSources);