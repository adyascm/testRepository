import React, { Component } from 'react';
import '../App.css';
import { Route, Switch, Redirect } from 'react-router-dom';
import { connect } from 'react-redux';
import agent from '../utils/agent';
import openPopup from '../utils/popup'
import { Card, Button, Form } from 'semantic-ui-react'

import {
  API_ROOT,
  SET_DATASOURCES,
  CREATE_DATASOURCE,
  HOME_PAGE_LOADED,
  HOME_PAGE_UNLOADED
} from '../constants/actionTypes';
import DataSourceItem from './DataSourceItem';

const mapStateToProps = state => ({
  ...state.home,
  appName: state.common.appName,
  currentUser: state.common.currentUser,
  dataSources: state.common.dataSources
});

const mapDispatchToProps = dispatch => ({
  onLoad: (tab, pager, payload) =>
    dispatch({ type: HOME_PAGE_LOADED, tab, pager, payload }),
  onUnload: () =>
    dispatch({ type: HOME_PAGE_UNLOADED }),
  setDataSources: (datasources) =>
    dispatch({ type: SET_DATASOURCES, payload: datasources }),
  addDataSource: (name) => ev => {
    ev.preventDefault();
    dispatch({ type: CREATE_DATASOURCE, payload: agent.Setting.createDataSource({ "display_name": name }) })
  }
    
});

function listenForCredentials(popup, resolve, reject) {
  if (!resolve) {
    return new Promise((resolve, reject) => {
      listenForCredentials(popup, resolve, reject);
    });

  } else {
    let email, token, error;

    try {
      let params = (new URL(popup.location)).searchParams;
      email = params.get("email");
      token = params.get("authtoken");
      error = params.get("error");
    } catch (err) { }

    if (email && token) {
      popup.close();
      agent.setToken(token);
      let currentUser = agent.Auth.current();
      resolve({ "token": token, "payload": currentUser });
    } else if (error) {
      reject({ errors: { Failed: error } });
    } else if (popup.closed) {
      reject({ errors: { Failed: "Authentication was cancelled." } })
    } else {
      setTimeout(() => {
        listenForCredentials(popup, resolve, reject);
      }, 50);
    }
  }
}

function authenticate(url) {
  let popup = openPopup(url, "_blank");
  return listenForCredentials(popup);
}

class ManageDataSources extends Component {
  // constructor() {
  //   super();
  //   this.signInGoogle = () => ev => {
  //       ev.preventDefault();
  //       //this.props.onSubmit();
  //       var url = API_ROOT + "/googleoauthlogin";
  //       authenticate(url).then(data => this.props.setDataSources(data)).catch(({errors}) => {this.props.onSignInError(errors)});
  //   };
  //}
  componentWillMount() {
    if (!this.props.common.dataSources)
      this.props.setDataSources(agent.Setting.getDataSources());
    this.newDataSourceName = "";
    this.changeField = value => {this.newDataSourceName = value;}
  }
  render() {
    return (

      <div>
        <Card.Group>
          {
              this.props.common.datasources && this.props.common.datasources.map(ds => {
              return (
                <DataSourceItem item={ds} />
              )
            })
          }
            <Card>

            <Card.Content>
              <Card.Description>
                Enter a friendly name to create a new datasource
                    </Card.Description>
              <Form>
                <Form.Field>
                  <input placeholder='Name' />
                </Form.Field>
              </Form>
            </Card.Content>
            <Card.Content extra>
              <div className='ui buttons'>
                <Button basic color='green' disabled={this.newDataSourceName} onClick={this.props.addDataSource("Testing")}>Google</Button>
              </div>
            </Card.Content>
          </Card>
        </Card.Group>
      </div>
    )
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(ManageDataSources);