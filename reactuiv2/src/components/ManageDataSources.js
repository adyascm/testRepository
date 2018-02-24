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
  DELETE_DATASOURCE_START,
  DASHBOARD_PAGE_LOADED,
  DASHBOARD_PAGE_UNLOADED,
  SCAN_UPDATE_RECEIVED,
  LOGIN_START,
  LOGIN_ERROR
} from '../constants/actionTypes';
import DataSourceItem from './DataSourceItem';

const mapStateToProps = state => ({
  ...state.auth,
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
  onDeleteDataSource: (datasource) => {
    dispatch({ type: DELETE_DATASOURCE_START, payload: datasource })
  },
  onPushNotification: (actionType, msg) => {
    dispatch({ type: actionType, payload: msg })
  },
  onLoginStart: () => 
    dispatch({ type: LOGIN_START }),
  onSignInError: (errors) =>
    dispatch({ type: LOGIN_ERROR, error: errors }),

});

class ManageDataSources extends Component {
  constructor() {
    super();
    this.addNewDatasource = () => ev => {
      ev.preventDefault();
      this.props.onLoginStart()
      authenticate("drive_scan_scope").then(data => {
        this.props.addDataSource("Testing")
      }).catch(({ errors }) => { 
        this.props.onSignInError(errors) 
      });
    };
    this.deleteDataSource = (datasource) => {
      this.props.onDeleteDataSource(datasource);
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
                  <Button basic color='green' disabled={this.newDataSourceName} onClick={this.addNewDatasource()} loading={this.props.inProgress?true:false} disabled={this.props.inProgress?true:false}>Scan</Button>
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