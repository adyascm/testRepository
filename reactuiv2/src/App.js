import React, { Component } from 'react';
import './App.css';

import { Route, Switch, Redirect } from 'react-router-dom';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import { store } from './store';
import Header from './components/Header.js'
import Home from './components/Home.js'
import Login from './components/Login.js'
import DataSources from './components/DataSources.js'
import Reports from './components/Reports.js'
import Resources from './components/Resources.js'
import Users from './components/Users.js'
import SecuredView from './components/SecuredView'
import DataSourceVerifiedView from './components/DataSourceVerifiedView'

import { APP_LOAD, REDIRECT } from './constants/actionTypes';
import agent from './utils/agent';

const mapStateToProps = state => {
  return {
    appLoaded: state.common.appLoaded,
    appName: state.common.appName,
    currentUser: state.common.currentUser,
    redirectTo: state.common.redirectTo
  }
};

const mapDispatchToProps = dispatch => ({
  onLoad: (payload, token) => {
    dispatch({ type: APP_LOAD, payload, token, skipTracking: true });
  },

  onRedirect: () =>
    dispatch({ type: REDIRECT })
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
  }
  render() {
    if (this.props.appLoaded) {
      return (
        <div className="App">
          <Header appName={this.props.appName} currentUser={this.props.currentUser} />
          <Switch>
            <Route exact path="/login" component={Login} />
            <Route exact path="/" component={SecuredView(DataSourceVerifiedView(Home))} />
            <Route path="/users" component={SecuredView(DataSourceVerifiedView(Users))} />
            <Route path="/resources" component={SecuredView(DataSourceVerifiedView(Resources))} />
            <Route path="/reports" component={SecuredView(DataSourceVerifiedView(Reports))} />
            <Route path="/datasources" component={SecuredView(DataSources)} />
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
