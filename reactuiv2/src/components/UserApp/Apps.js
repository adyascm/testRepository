import React, { Component } from 'react';

import { Route, Switch, Redirect } from 'react-router-dom';

import { connect } from 'react-redux';
import { Container, Dimmer, Loader, Grid, Divider, Radio, Sticky } from 'semantic-ui-react';

import agent from '../../utils/agent';

import AppList from './AppList';
import AppDetailsSection from './AppDetailsSection'

import {
  APPS_PAGE_LOADED,
  APPS_PAGE_UNLOADED,
  APPS_PAGE_LOAD_START
} from '../../constants/actionTypes';


const mapStateToProps = state => ({
  appName: state.common.appName,
  currentApp: state.common.currentApp
});

const mapDispatchToProps = dispatch => ({
  onLoad: (payload) =>
    dispatch({ type: APPS_PAGE_LOADED, payload }),
  onUnload: () =>
    dispatch({ type: APPS_PAGE_UNLOADED }),
  onLoadStart: () =>
    dispatch({ type: APPS_PAGE_LOAD_START }),
});

// Here scopeExposure is 0 for all, 1 for readonly, 2 for fullyscope
class Apps extends Component {
  constructor(props) {
    super(props);
    this.state = {
        scopeExposure: 2
    }
    this.onCheckBoxChecked = this.onCheckBoxChecked.bind(this)
  }

  componentWillMount(){
    this.props.onLoadStart();
    this.props.onLoad(agent.Apps.getapps());
  }
  

  onCheckBoxChecked = (e, { value }) => this.setState({ scopeExposure:value })
  render() {
    const { contextRef } = this.state
    let containerStyle = {
      height: "100%",
      textAlign: "left"
    };

    var gridWidth = 16;
    
    if (this.props.apps.selectedAppItem) {
      gridWidth = 4;
    }

    if (this.props.isLoading) {
      return (
        <Container style={containerStyle}>
          <Dimmer active inverted>
            <Loader inverted content='Loading' />
          </Dimmer>
        </Container >
      )
    }
    else {
      var appList = (<AppList scopeExposure={this.state.scopeExposure} />)
      var appDetails = this.props.apps.selectedAppItem ? (<Grid.Column width={16 - gridWidth}>
                                                              <AppDetailsSection  applications ={[]} />
                                                          </Grid.Column>) : ""
      return (
        <Container style={containerStyle}>
          <Grid divided='vertically' stretched>
            <Grid.Row >
              <Grid.Column stretched width="5">
                <Radio name='radioGroup'
                  label='Show all apps'
                  value={0}
                  checked={this.state.scopeExposure === 0}
                  onChange={this.onCheckBoxChecked}
                />
              </Grid.Column>
              <Grid.Column stretched width="5">
                <Radio name='radioGroup'
                  label='Show readonly scope apps'
                  value={1}
                  checked={this.state.scopeExposure === 1}
                  onChange={this.onCheckBoxChecked}
                />
              </Grid.Column>
              <Grid.Column stretched width="5">
                <Radio name='radioGroup'
                  label='Show full scope apps'
                  value={2}
                  checked={this.state.scopeExposure === 2}
                  onChange={this.onCheckBoxChecked}
                />
              </Grid.Column>
            </Grid.Row>
            <Grid.Row stretched>
              <Grid.Column stretched width={gridWidth}> 
                {appList}
              </Grid.Column>
            {appDetails}
            </Grid.Row>
          </Grid>
        </Container >

      )
    }

  }
}
export default connect(mapStateToProps, mapDispatchToProps)(Apps);