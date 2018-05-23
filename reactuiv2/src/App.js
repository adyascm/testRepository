import React, { Component } from 'react';
import './App.css';

import { Route, Switch } from 'react-router-dom';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import { store } from './store';
import Header from './components/Header.js'
import Dashboard from './components/Dashboard.js'
import Login from './components/Login.js'
import NewLogin from './components/NewLogin'
import ManageDataSources from './components/Setting/Setting.js'
import Reports from './components/Reports/Reports.js'
import Resources from './components/Resources/Resources.js'
import UsersNew from './components/Users/UsersNew.js'
import Apps from './components/UserApp/Apps.js'
import Policy from './components/Policy/Policy.js'
import Alert from './components/Alert'
import SecuredView from './components/SecuredView'
import DataSourceVerifiedView from './components/Setting/DataSourceVerifiedView'
import AuditLogTable from './components/AuditLogTable'
import GlobalMessage from './GlobalMessage';

import { Container, Message } from 'semantic-ui-react'


import { APP_LOAD, REDIRECT } from './constants/actionTypes';
import agent from './utils/agent';
import initializePushNotifications from './pushnotifications/realtimeFramework'

const mapStateToProps = state => {
  return {
    appLoaded: state.common.appLoaded,
    appName: state.common.appName,
    currentUser: state.common.currentUser,
    redirectTo: state.common.redirectTo,
    appMessage: state.common.appMessage,
    datasources: state.common.datasources
  }
};

const mapDispatchToProps = dispatch => ({
  onLoad: (payload, token) => {
    dispatch({ type: APP_LOAD, payload, token, skipTracking: true });
  },
  onRedirect: () =>
    dispatch({ type: REDIRECT }),
  onPushNotification: (actionType, msg) => {
      dispatch({ type: actionType, payload: msg })
    }
});

class App extends Component {

  componentWillReceiveProps(nextProps) {
    if (nextProps.redirectTo) {
      store.dispatch(push(nextProps.redirectTo));
      this.props.onRedirect();
    }
    if(nextProps.datasources && nextProps.datasources.length > 0 && !nextProps.datasources[0].is_dummy_datasource)
    {
      if(!this.props.datasources || this.props.datasources.length < 1 || this.props.datasources[0].datasource_id !== nextProps.datasources[0].datasource_id)
      {
        initializePushNotifications(nextProps, nextProps.datasources[0]);
      }
    }
  }
  componentWillMount() {
    const token = window.localStorage.getItem('jwt');
    if (token) {
      agent.setToken(token);
    }

    this.props.onLoad(token ? agent.Auth.current() : null, token);
  }
  render() {
    if (this.props.appLoaded && !this.props.redirectTo) {
      return (
        <div className="App">
          <Header appName={this.props.appName} currentUser={this.props.currentUser}/>
          <Switch>
            <Container fluid style={{ marginTop: '6em', height: '100%' }}>
            <GlobalMessage />
            <Message header='Important!' content={this.props.appMessage} hidden={!this.props.appMessage} style={{ marginTop: '6em'}} floating/>
              <Route exact path="/login" component={NewLogin} />
              <Route exact path="/" component={SecuredView(DataSourceVerifiedView(Dashboard))} />
              {/* <Route path="/users" component={SecuredView(DataSourceVerifiedView(Users))} /> */}
              <Route path="/users" component={SecuredView(DataSourceVerifiedView(UsersNew))} />
              <Route path="/resources" component={SecuredView(DataSourceVerifiedView(Resources))} />
              <Route path="/reports" component={SecuredView(DataSourceVerifiedView(Reports))} />
              <Route path="/datasources" component={SecuredView(ManageDataSources)} />
              <Route path="/auditlog" component={SecuredView(DataSourceVerifiedView(AuditLogTable))} />
              <Route path="/apps" component={SecuredView(DataSourceVerifiedView(Apps))} />
              <Route path="/policies" component={SecuredView(DataSourceVerifiedView(Policy))} />
              <Route path="/alerts" component={SecuredView(DataSourceVerifiedView(Alert))} />
              <Route path="/oauthstatus/:status" component={Dashboard} />
            </Container>
          </Switch>
        </div>
      );
    }
    return (
      <div className="App">
        <Header
          appName={this.props.appName}
          currentUser={this.props.currentUser} />
      </div>
    );
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(App);
