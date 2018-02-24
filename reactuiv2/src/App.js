import React, { Component } from 'react';
import './App.css';

import { Route, Switch, Redirect } from 'react-router-dom';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import { store } from './store';
import Header from './components/Header.js'
import Dashboard from './components/Dashboard.js'
import Login from './components/Login.js'
import ManageDataSources from './components/ManageDataSources.js'
import Reports from './components/Reports/Reports.js'
import Resources from './components/Resources/Resources.js'
import Users from './components/Users/Users.js'
import SecuredView from './components/SecuredView'
import DataSourceVerifiedView from './components/DataSourceVerifiedView'
import GlobalError from './GlobalError';

import { Container, Message, Segment } from 'semantic-ui-react'


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
    errorMessage: state.common.errorMessage
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
  }
  componentWillMount() {
    const token = window.localStorage.getItem('jwt');
    if (token) {
      agent.setToken(token);
    }

    this.props.onLoad(token ? agent.Auth.current() : null, token);

    initializePushNotifications(this.props);
  }
  render() {
    if (this.props.appLoaded) {
      return (
        <div className="App">
          <Header appName={this.props.appName} currentUser={this.props.currentUser}/>
          <Switch>
            <Container fluid style={{ marginTop: '6em', height: '100%' }}>
            {this.props.errorMessage?<GlobalError />:''}
            <Message header='Important!' content={this.props.appMessage} hidden={!this.props.appMessage} style={{ marginTop: '6em'}} floating/>
              <Route exact path="/login" component={Login} />
              <Route exact path="/" component={SecuredView(DataSourceVerifiedView(Dashboard))} />
              <Route path="/users" component={SecuredView(DataSourceVerifiedView(Users))} />
              <Route path="/resources" component={SecuredView(DataSourceVerifiedView(Resources))} />
              <Route path="/reports" component={SecuredView(DataSourceVerifiedView(Reports))} />
              <Route path="/datasources" component={SecuredView(ManageDataSources)} />
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
