import React, { Component } from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom'
import agent from '../../utils/agent';
import oauth from '../../utils/oauth';
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
  addDataSource: (name, datasource_type, isdummy = false) => {
    dispatch({ type: CREATE_DATASOURCE, payload: agent.Setting.createDataSource({ "display_name": name, "isDummyDatasource": isdummy, "datasource_type": datasource_type }) })
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
    dispatch({ type: SET_REDIRECT_PROPS, redirectUrl: url })
});

class ManageDataSources extends Component {
  constructor() {
    super();

    this.handleClick = this.handleClick.bind(this);
    this.onPollChanges = this.onPollChanges.bind(this);

    this.addNewDatasource = (datasourceName, datasorceType) => {
        if (datasourceName === 'GSUITE') {
            this.props.onDataSourceLoad()
            if (this.props.currentUser.is_serviceaccount_enabled) {
                this.props.addDataSource("GSuite", "GSUITE")
            } else {
                oauth.authenticateGsuite("drive_scan_scope").then(data => {
                this.props.addDataSource("GSuite", "GSUITE")
                }).catch(({ errors }) => {
                this.props.onDataSourceLoadError(errors)
                this.props.displayErrorMessage(errors)
                });
            }
        }
        else if(datasourceName === 'SLACK'){
            //make api call for slack
            oauth.authenticateSlack().then(data => {
            this.props.addDataSource("Slack", "SLACK")
            })

        }
    };

    this.addDummyDatasource = () => {
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
    window.scrollTo(0, 0)
    if (!this.props.common.datasources)
      this.props.setDataSources(agent.Setting.getDataSources());
    this.newDataSourceName = "";
    this.changeField = value => { this.newDataSourceName = value; }
  }

  handleClick() {
    this.props.goToDashboard("/")
    this.props.history.push("/")
  }

  onPollChanges = (datasource) => {
    agent.Setting.pollGSuiteDriveChanges(datasource);
  }

  render() {
    if (this.props.currentUser.is_serviceaccount_enabled && !this.props.currentUser.is_admin) {
      return (
        <Container>
          You are not authorized to manage datasources. Please contact your administrator.
          </Container>
      )
    }

    let connectors = {
      "GSUITE":
        <GsuiteDataSourceItem key={1} item={{ datasource_type: "GSUITE" }} serviceAccount={this.props.currentUser.is_serviceaccount_enabled} onAdd={() => this.addNewDatasource("GSUITE", "GSUITE")} onAddDummy={this.addDummyDatasource} onDelete={this.deleteDataSource} handleClick={this.handleClick} onPollChanges={this.onPollChanges} />
      ,
      "SLACK":
        <SlackDataSourceItem key={2} item={{ datasource_type: "SLACK" }} onAdd={() => this.addNewDatasource("SLACK", "SLACK")} onDelete={this.deleteDataSource} handleClick={this.handleClick} onPollChanges={this.onPollChanges} />
    }

    let ds = this.props.common.datasources && this.props.common.datasources.map(ds => {
      if (ds.datasource_type === "GSUITE") {
        delete connectors["GSUITE"];
        return (
          <GsuiteDataSourceItem key={ds["creation_time"]} item={ds} inProgress={this.props.inProgress} onAdd={() => this.addNewDatasource("GSUITE", "SLACK")} onDelete={this.deleteDataSource} handleClick={this.handleClick} onPollChanges={this.onPollChanges} />
        )
      }
    });
    let available = [];
    Object.keys(connectors).forEach(function (key) {
      available.push(connectors[key]);
    });
    let moreConnectors = null;
    if(available.length > 0)
    {
      moreConnectors = (
        <Container>
            <Divider horizontal>Available Connectors</Divider>
            <Card.Group itemsPerRow='1'>
                {available}
            </Card.Group>
        </Container>);
    }
    return (
      <Container>
        <Card.Group itemsPerRow='1'>
          {ds}
        </Card.Group>
        {moreConnectors}
      </Container>
    )
  }
}

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(ManageDataSources));
