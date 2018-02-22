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


class Users extends Component {
  constructor(props) {
    super(props);

    this.handleChange = this.handleChange.bind(this);

    this.state = {
      options: [
        {text: 'External Shared',
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
      }
    }
  }

  handleChange(event,data) {
    this.props.setFileExposureType(this.state.fileExposureType[data.value])
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
                defaultValue="External Shared"
              />
            </Grid.Column>
            <Grid.Column stretched width="5">
              <Form>
                <Form.Field>
                  <input placeholder='Filter by File type ...' />
                </Form.Field>
              </Form>
            </Grid.Column>
          </Grid.Row>
          <Grid.Row stretched>
            <Grid.Column stretched width={gridWidth}>
              <ResourcesList />
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

export default connect(mapStateToProps,mapDispatchToProps)(Users);