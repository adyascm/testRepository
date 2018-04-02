import React, { Component } from 'react';

import { connect } from 'react-redux';
import { Grid, Container, Dropdown, Form } from 'semantic-ui-react'

import ResourcesList from './ResourcesList';
import ResourceDetailsSection from './ResourceDetailsSection';
import Actions from '../actions/Actions';
//import TestResourcesList from './TestResourcesList';
import ResourcesListTable from './ResourceListTable'

import {  RESOURCES_FILTER_CHANGE,
          RESOURCES_SEARCH_EMPTY
      } from '../../constants/actionTypes';

const mapStateToProps = state => ({
  ...state.resources,
  redirectTo: state.dashboard.redirectTo,
  redirectFilter: state.dashboard.filterType
});

const mapDispatchToProps = dispatch => ({
  changeFilter: (property, value) => dispatch({ type: RESOURCES_FILTER_CHANGE, property, value }),
  clearSearchData: () => dispatch({ type: RESOURCES_SEARCH_EMPTY })
});


class Resources extends Component {
  constructor(props) {
    super(props);

    // this.handleExposureTypeChange = this.handleExposureTypeChange.bind(this);
    // this.handleResourceTypeChange = this.handleResourceTypeChange.bind(this);
    // this.handleKeyPress = this.handleKeyPress.bind(this);

    // this.exposureFilterOptions = [
    //     {text: 'Externally Shared',
    //      value: 'EXT'},
    //     {text: 'Domain Shared',
    //      value: 'DOMAIN'},
    //     {text: 'Internally Shared',
    //      value: 'INT'},
    //      {text: 'All Files',
    //      value: 'ALL'}
    //   ]

    //   this.state = {
    //     filterResourceType: "",
    //   }
  }

  // handleExposureTypeChange(event,data) {
  //   let value = data.value === 'ALL'?'':data.value
  //   if (value !== this.props.filterExposureType)
  //     this.props.changeFilter("filterExposureType", value);
  // }

  // handleResourceTypeChange(event) {
  //   this.setState({
  //     filterResourceType: event.target.value
  //   });
  // }

  // handleKeyPress(event) {
  //   if (event.key === 'Enter') {
  //     this.props.changeFilter("filterResourceType", this.state.filterResourceType);
  //   }
  // }
  componentWillMount(){

    if (this.props.redirectTo && this.props.redirectTo.includes("resources")) {
      if (this.props.redirectFilter) {
        if (this.props.redirectFilter.includes("Files")) {
          this.props.changeFilter("filterResourceType", '')
          this.props.changeFilter("filterExposureType",'')  
        }
        else if (this.props.redirectFilter.includes("Folders")) {
          this.props.changeFilter("filterExposureType",'')
          this.props.changeFilter("filterResourceType", 'folder')
        }
      }
    }

    // this.setState({
    //   filterResourceType: this.props.filterResourceType
    // });
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
          {/* <Grid.Row >
            <Grid.Column stretched width="5">
              <Dropdown
                options={this.exposureFilterOptions}
                selection
                onChange={this.handleExposureTypeChange}
                value={this.props.filterExposureType === ''?'ALL':this.props.filterExposureType}
              />
            </Grid.Column>
            <Grid.Column stretched width="5">
              <Form>
                <Form.Field>
                  <input placeholder='Filter by File type ...' value={this.state.filterResourceType} onChange={this.handleResourceTypeChange} onKeyPress={this.handleKeyPress} />
                </Form.Field>
              </Form>
            </Grid.Column>
          </Grid.Row> */}
          <Grid.Row stretched>
            <Grid.Column stretched width={gridWidth}>
              <ResourcesListTable />
              {/* <ResourcesList gridWidth={gridWidth} /> */}
              {/* <TestResourcesList /> */}
            </Grid.Column>
            {
              this.props.rowData?
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

export default connect(mapStateToProps,mapDispatchToProps)(Resources);
