import React, { Component } from 'react';

import { connect } from 'react-redux';
import { Container, Dimmer, Loader, Grid, Header } from 'semantic-ui-react';

import agent from '../../utils/agent';

import Actions from '../actions/Actions'
import AppDetailsSection from './AppDetailsSection'
import InstalledApp from './InstalledApp'
import InventoryApp from './InventoryApp'
import {
  APPS_PAGE_LOAD_START, APPS_PAGE_LOADED
} from '../../constants/actionTypes';

const mapStateToProps = state => ({
  ...state.apps,
  ...state.common
});

const mapDispatchToProps = dispatch => ({
  onLoad: (payload) => dispatch({ type: APPS_PAGE_LOADED, payload }),
  onLoadStart: () => dispatch({ type: APPS_PAGE_LOAD_START })
});


class Apps extends Component {
  constructor(props) {
    super(props);
  }
  
  render() {
    let containerStyle = {
      height: "100%",
      textAlign: "left",
    };
    let style = { fontSize:'larger', width:'20vw'}

    var gridWidth = 16;
    if (this.props.selectedAppItem && this.props.selectedAppItem.id) {
      gridWidth = 4;
      style = { fontSize:'small', width:'10vw'}
    }
    if (this.props.isLoadingApps && !this.props.selectedAppItem) {
      return (
        <Container style={containerStyle}>
          <Dimmer active inverted>
            <Loader inverted content='Loading' />
          </Dimmer>
        </Container >
      )
    }
    else {
      return (
        <Container fluid style={containerStyle}>
          <Grid divided="vertically" stretched>
            <Grid.Row stretched>
              <Grid.Column stretched width={gridWidth}>
                <InstalledApp style={style} />
              </Grid.Column>
               { this.props.selectedAppItem ? (<Grid.Column stretched width={16 - gridWidth}> 
                <Container fluid >
                <AppDetailsSection />
                </Container> 
              </Grid.Column>) : null} 
            </Grid.Row>
            <Actions /> 
          </Grid>
        </Container >
      )
    }
  }
}

export default connect(mapStateToProps,mapDispatchToProps)(Apps);