import React, { Component } from 'react';

import { connect } from 'react-redux';
import { Grid, Container, Dimmer, Loader, Dropdown, Form, Button, Modal, Checkbox, Header } from 'semantic-ui-react'

import ResourceDetailsSection from './ResourceDetailsSection';
import Actions from '../actions/Actions';
import ResourcesListTable from './ResourceListTable'
import agent from '../../utils/agent';
import {
  RESOURCES_FILTER_CHANGE,
  RESOURCES_SEARCH_EMPTY
} from '../../constants/actionTypes';

const mapStateToProps = state => ({
  ...state.resources,
  redirectTo: state.dashboard.redirectTo,
  redirectFilter: state.dashboard.filterType,
  selectedUser: state.users.selectedUserItem
});

const mapDispatchToProps = dispatch => ({
  changeFilter: (property, value) => dispatch({ type: RESOURCES_FILTER_CHANGE, property, value }),
  clearSearchData: () => dispatch({ type: RESOURCES_SEARCH_EMPTY })
});


class Resources extends Component {

  constructor(props) {
    super(props);
  }

  componentWillMount() {
    window.scrollTo(0, 0)
  }

  componentWillUnmount() {
    this.props.clearSearchData()
  }

  render() {

    let containerStyle = {
      height: "100%",
      textAlign: "left"
    };

    var gridWidth = 16;
    if (this.props.rowData)
      gridWidth = 4

    return (
      <Container fluid style={containerStyle}>
        <Grid divided='vertically' stretched >
          <Grid.Row stretched>
            <Grid.Column stretched width={gridWidth}>
              <ResourcesListTable />
            </Grid.Column>
            {
              this.props.rowData ?
                (<Grid.Column stretched width={16 - gridWidth}>
                  <Container fluid >
                    <ResourceDetailsSection />
                  </Container>
                </Grid.Column>) : null
            }
          </Grid.Row>
        </Grid>
        <Actions />
      </Container>
    )
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(Resources);
