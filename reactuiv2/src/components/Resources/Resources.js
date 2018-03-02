import React, { Component } from 'react';

import { connect } from 'react-redux';
import { Grid, Container, Dropdown, Form } from 'semantic-ui-react'

import ResourcesList from './ResourcesList';
import ResourceDetailsSection from './ResourceDetailsSection';
import ResourcesActions from '../actions/ResourcesActions';
import TestResourcesList from './TestResourcesList';

import {RESOURCES_FILTER_CHANGE} from '../../constants/actionTypes';

const mapStateToProps = state => ({
    ...state.resources
});

const mapDispatchToProps = dispatch => ({
  changeFilter: (property, value) => dispatch({ type: RESOURCES_FILTER_CHANGE, property, value })
});


class Resources extends Component {
  constructor(props) {
    super(props);

    this.handleExposureTypeChange = this.handleExposureTypeChange.bind(this);
    this.handleResourceTypeChange = this.handleResourceTypeChange.bind(this);
    this.handleKeyPress = this.handleKeyPress.bind(this);

    this.exposureFilterOptions = [
        {text: 'Externally Shared',
         value: 'EXT'},
        {text: 'Domain Shared',
         value: 'DOMAIN'},
        {text: 'Internally Shared',
         value: 'INT'}
      ]

      this.state = {
        filterResourceType: ""
      }
  }

  handleExposureTypeChange(event,data) {
    if (data && data.value !== this.props.filterExposureType)
      this.props.changeFilter("filterExposureType", data.value);
  }

  handleResourceTypeChange(event) {
    this.setState({
      filterResourceType: event.target.value
    });
  }

  handleKeyPress(event) {
    if (event.key === 'Enter') {
      console.log(event.target.value)
      this.props.changeFilter("filterResourceType", this.state.filterResourceType);
    }
  }
  componentWillMount(){
    this.setState({
      filterResourceType: this.props.filterResourceType
    });
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
      <Container style={containerStyle}>
        <Grid divided='vertically' stretched >
          <Grid.Row >
            <Grid.Column stretched width="5">
              <Dropdown
                options={this.exposureFilterOptions}
                selection
                onChange={this.handleExposureTypeChange}
                defaultValue={this.props.filterExposureType}
              />
            </Grid.Column>
            <Grid.Column stretched width="5">
              <Form>
                <Form.Field>
                  <input placeholder='Filter by File type ...' value={this.state.filterResourceType} onChange={this.handleResourceTypeChange} onKeyPress={this.handleKeyPress} />
                </Form.Field>
              </Form>
            </Grid.Column>
          </Grid.Row>
          <Grid.Row stretched>
            <Grid.Column stretched width={gridWidth}>
              <ResourcesList />
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
        <ResourcesActions />
      </Container>
    )
  }
}

export default connect(mapStateToProps,mapDispatchToProps)(Resources);
