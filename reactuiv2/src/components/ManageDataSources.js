import React, { Component } from 'react';
import '../App.css';
import { Route, Switch, Redirect } from 'react-router-dom';
import { connect } from 'react-redux';
import agent from '../utils/agent';
import authenticate from '../utils/oauth';
import { Card, Button, Form, Container, Header, Divider } from 'semantic-ui-react'
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
  LOGIN_ERROR,
  DATASOURCE_LOAD_START,
  DATASOURCE_LOAD_END,
  ASYNC_END
} from '../constants/actionTypes';
import DataSourceItem from './DataSourceItem';

const mapStateToProps = state => ({
  ...state.auth,
  appName: state.common.appName,
  currentUser: state.common.currentUser,
  dataSources: state.common.dataSources,
  errorMessage: state.common.errMessage,
  datasourceLoading: state.common.datasourceLoading
});

const mapDispatchToProps = dispatch => ({
  setDataSources: (datasources) =>
    dispatch({ type: SET_DATASOURCES, payload: datasources }),
  addDataSource: (name, isdummy = false) => {
    dispatch({ type: CREATE_DATASOURCE, payload: agent.Setting.createDataSource({ "display_name": name, "isDummyDatasource": isdummy }) })
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
  onDataSourceLoad: () => 
    dispatch({ type: DATASOURCE_LOAD_START }),
  onDataSourceLoadError: () =>
    dispatch({ type: DATASOURCE_LOAD_END }),
  displayErrorMessage: (error) =>
    dispatch({ type: ASYNC_END, errors: error.message?error.message:error['Failed'] })
});

class ManageDataSources extends Component {
  constructor() {
    super();
    this.addNewDatasource = () => ev => {
      ev.preventDefault();
      this.props.onDataSourceLoad()
      authenticate("drive_scan_scope").then(data => {
        this.props.addDataSource("GSuite")
      }).catch(({ errors }) => { 
        console.log("errors : ", errors)
        this.props.onDataSourceLoadError(errors),
        this.props.displayErrorMessage(errors)
      });
    };

    this.addDummyDatasource = () => ev => {
      ev.preventDefault();
      this.props.onDataSourceLoad()
      this.props.addDataSource("Dummy readonly playground", true);
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
                  <Header>Welcome  {this.props.currentUser.first_name}!, Let us get started by connecting your first GSuite account by clicking the button below. </Header>
                  <Divider />
                  We only require <b>read-only</b> permission at this point and would ask for incremental permissions when you take actions from our app.<br />
                  If you are still deciding, you can also create a dummy
                <Button basic compact onClick={this.addDummyDatasource()} loading={this.props.inProgress ? true : false} disabled={this.props.inProgress || this.props.errorMessage ? true : false}>playground</Button>
                  which will enable a read-only version of this app with dummy data to get you familiar with different features.
                </Card.Description>
              </Card.Content>
              <Card.Content extra>
                <div className='ui buttons'>
                <Button basic color='green' disabled={this.newDataSourceName !== ""?true:false} onClick={this.addNewDatasource()} loading={this.props.datasourceLoading?true:false}>Connect your GSuite</Button>
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
                  <DataSourceItem key={ds["creation_time"]} item={ds} onDelete={this.deleteDataSource} />
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