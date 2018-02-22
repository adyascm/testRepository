import React, { Component } from 'react';

import { connect } from 'react-redux';
import { Grid, Container } from 'semantic-ui-react'

import ResourcesList from './ResourcesList';
import ResourcePermissionSection from './ResourcePermissionSection';
import ResourcesActions from '../actions/ResourcesActions';

const mapStateToProps = state => ({
    ...state.resources
});


class Users extends Component {
  constructor(props) {
    super(props);
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
        <Grid stretched >
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

export default connect(mapStateToProps)(Users);