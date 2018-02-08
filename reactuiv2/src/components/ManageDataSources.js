import React, { Component } from 'react';
import '../App.css';
import { Route, Switch, Redirect } from 'react-router-dom';
import { connect } from 'react-redux';
import agent from '../utils/agent';
import authenticate from '../utils/oauth';
import { Card, Button, Form } from 'semantic-ui-react'

import {
  API_ROOT,
  SET_DATASOURCES,
  CREATE_DATASOURCE,
  DASHBOARD_PAGE_LOADED,
  DASHBOARD_PAGE_UNLOADED
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
  }

});

class ManageDataSources extends Component {
  constructor() {
    super();
    this.addNewDatasource = () => ev => {
      ev.preventDefault();
      authenticate("drive_scan_scope").then(data => this.props.addDataSource("Testing")).catch(({ errors }) => { this.props.onSignInError(errors) });
    };
  }
  componentWillMount() {
    if (!this.props.common.dataSources)
      this.props.setDataSources(agent.Setting.getDataSources());
    this.newDataSourceName = "";
    this.changeField = value => { this.newDataSourceName = value; }
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
                <Button basic color='green' disabled={this.newDataSourceName} onClick={this.addNewDatasource()}>Google</Button>
              </div>
            </Card.Content>
          </Card>
        </Card.Group>
      </div>
    )
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(ManageDataSources);