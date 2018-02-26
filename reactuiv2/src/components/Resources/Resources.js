import React, { Component } from 'react';

import { connect } from 'react-redux';
import { Grid, Container, Dropdown, Form } from 'semantic-ui-react'

import ResourcesList from './ResourcesList';
import ResourcePermissionSection from './ResourcePermissionSection';
import ResourcesActions from '../actions/ResourcesActions';

import {RESOURCES_SET_FILE_SHARE_TYPE} from '../../constants/actionTypes';

const mapStateToProps = state => ({
    ...state.resources
});

const mapDispatchToProps = dispatch => ({
  setFileExposureType: (payload) => dispatch({ type: RESOURCES_SET_FILE_SHARE_TYPE, payload })
});


class Resources extends Component {
  constructor(props) {
    super(props);

    this.handleChange = this.handleChange.bind(this);
    this.handleKeyPress = this.handleKeyPress.bind(this);

    this.state = {
      options: [
        {text: 'Externally Shared',
         value: 'External Shared'},
        {text: 'Domain Shared',
         value: 'Domain Shared'},
        {text: 'Internally Shared',
         value: 'Internally Shared'}
      ],
      fileExposureType: {
        'External Shared': 'EXT',
        'Domain Shared': 'DOMAIN',
        'Internally Shared': 'INT'
      },
      filterInputValue: '',
      fileResourceType: undefined
    }
  }

  handleChange(event,data) {
    if (data && this.state.fileExposureType[data.value])
      this.props.setFileExposureType(this.state.fileExposureType[data.value])
    else {
      if (event.target.value === '')
        this.setState({
          filterInputValue: '',
          fileResourceType: ''
        })
      else
        this.setState({
          filterInputValue: event.target.value
        })
    }
  }

  handleKeyPress(event) {
    if (event.key === 'Enter') {
      console.log("captured form value : ", this.state.filterInputValue)
      this.setState({
        fileResourceType: this.state.filterInputValue
      })
    }
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
                options={this.state.options}
                selection
                onChange={this.handleChange}
                defaultValue={!this.props.exposureType || this.props.exposureType === 'EXT'?"External Shared":
                              this.props.exposureType === 'DOMAIN'?"Domain Shared":"Internally Shared"}
              />
            </Grid.Column>
            <Grid.Column stretched width="5">
              <Form>
                <Form.Field>
                  <input placeholder='Filter by File type ...' value={this.state.filterInputValue} onChange={this.handleChange} onKeyPress={this.handleKeyPress} />
                </Form.Field>
              </Form>
            </Grid.Column>
          </Grid.Row>
          <Grid.Row stretched>
            <Grid.Column stretched width={gridWidth}>
              <ResourcesList resourceType={this.state.fileResourceType} />
            </Grid.Column>
            {
              this.props.rowData?
              (<Grid.Column stretched width={16 - gridWidth}>
                <Container fluid >
                  <ResourcePermissionSection />
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
