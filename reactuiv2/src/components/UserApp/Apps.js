import React, { Component } from 'react';

import { connect } from 'react-redux';
import { Container, Dimmer, Loader, Grid, Radio } from 'semantic-ui-react';

import agent from '../../utils/agent';

import AppList from './AppList';
import Actions from '../actions/Actions'
import AppDetailsSection from './AppDetailsSection'

import {
  APPS_PAGE_LOADED,
  APPS_PAGE_UNLOADED,
  APPS_PAGE_LOAD_START
} from '../../constants/actionTypes';


const mapStateToProps = state => ({
  appName: state.common.appName,
  currentApp: state.common.currentApp,
  appsSearchPayload: state.apps.appsSearchPayload,
  appsPayload: state.apps.appPayLoad,
  redirectTo: state.dashboard.redirectTo,
  redirectFilter: state.dashboard.filterType,
  appDeleted: state.apps.appDeleted,
  isLoading: state.apps.isLoadingApps,
  selectedAppItem: state.apps.selectedAppItem
});

const mapDispatchToProps = dispatch => ({
  onLoad: (payload) =>
    dispatch({ type: APPS_PAGE_LOADED, payload }),
  onUnload: () =>
    dispatch({ type: APPS_PAGE_UNLOADED }),
  onLoadStart: () =>
    dispatch({ type: APPS_PAGE_LOAD_START })
});

class Apps extends Component {
  constructor(props) {
    super(props);
  }

  componentWillMount(){
    window.scrollTo(0, 0)
    this.props.onLoadStart();
    this.props.onLoad(agent.Apps.getapps());
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.appDeleted !== this.props.appDeleted) {
      nextProps.onLoadStart()
      nextProps.onLoad(agent.Apps.getapps())
    }
  }
  
  render() {
    let containerStyle = {
      height: "100%",
      textAlign: "left"
    };

    var gridWidth = 16;
    
    if (this.props.selectedAppItem) {
      gridWidth = 4;
    }

    if (this.props.isLoading && !this.props.selectedAppItem) {
      return (
        <Container style={containerStyle}>
          <Dimmer active inverted>
            <Loader inverted content='Loading' />
          </Dimmer>
        </Container >
      )
    }
    else if (this.props.appsPayload && this.props.appsPayload.length) {
      return (
        <Container style={containerStyle}>
          <Grid divided='vertically' stretched>
            <Grid.Row stretched>
              <Grid.Column stretched width={gridWidth}> 
                <AppList />
              </Grid.Column>
              {this.props.selectedAppItem ? (<Grid.Column width={16 - gridWidth}>
                                                              <AppDetailsSection />
                                                          </Grid.Column>) : null}
            </Grid.Row>
            <Actions />
          </Grid>
        </Container >

      )
    }

    else 
      return (
        <div>
          No apps to display
        </div>
      )

  }
}
export default connect(mapStateToProps, mapDispatchToProps)(Apps);