import React, { Component } from 'react';
import '../App.css';
import { connect } from 'react-redux';
import agent from '../utils/agent';
import authenticate from '../utils/oauth';
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
  SET_CURRENT_URL
} from '../constants/actionTypes';
import DataSourceItem from './DataSourceItem';

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
    dispatch({ type: ASYNC_END, errors: error.message ? error.message : error['Failed'] }),
  goToDashboard: (url) =>
    dispatch({ type: SET_CURRENT_URL, url })
});

class ManageDataSources extends Component {
  constructor() {
    super();

    this.handleClick = this.handleClick.bind(this);

    this.addNewDatasource = () => ev => {
      ev.preventDefault();
      this.props.onDataSourceLoad()
      if (this.props.currentUser.is_serviceaccount_enabled) {
        this.props.addDataSource("GSuite")
      } else {
        authenticate("drive_scan_scope").then(data => {
          this.props.addDataSource("GSuite")
        }).catch(({ errors }) => {
          this.props.onDataSourceLoadError(errors)
          this.props.displayErrorMessage(errors)
        });
      }

    };

    this.addDummyDatasource = () => ev => {
      ev.preventDefault();
      this.props.onDataSourceLoad()
      this.props.addDataSource("Sample dataset", true);
    };

    this.deleteDataSource = (datasource) => {
      this.props.onDeleteDataSource(datasource);
      agent.Setting.deleteDataSource(datasource).then(res => {
        this.props.setDataSources([])
      });
    };
  }

  componentWillMount() {
    if (!this.props.common.datasources)
      this.props.setDataSources(agent.Setting.getDataSources());
    this.newDataSourceName = "";
    this.changeField = value => { this.newDataSourceName = value; }
  }

  handleClick() {
    this.props.goToDashboard("/")
  }

  render() {
    if (!this.props.common.datasources || !this.props.common.datasources.length) {
      return (
        <Container>
          <Card.Group>
            <Card fluid>
              <Card.Content>
                <Card.Description>
                  <Header>Welcome  {this.props.currentUser.first_name}! Get started by connecting your GSuite account. </Header>
                  <Divider />
                  We only require read-only permission at this stage and will ask for incremental permissions when you take actions from the app.<br />
                  Before connecting your GSuite account, you can use a
                <Button basic compact onClick={this.addDummyDatasource()} loading={this.props.inProgress ? true : false} disabled={this.props.inProgress || this.props.errorMessage ? true : false}>sample dataset</Button>
                  to get familiar with the features.
                </Card.Description>
              </Card.Content>
              <Card.Content extra>
                <div className='ui buttons'>
                  <Button basic color='green' disabled={this.newDataSourceName !== "" ? true : false} onClick={this.addNewDatasource()} loading={this.props.datasourceLoading ? true : false}>Connect your GSuite</Button>
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
                  <DataSourceItem key={ds["creation_time"]} item={ds} onDelete={this.deleteDataSource} handleClick={this.handleClick} />
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
