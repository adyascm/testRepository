import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Card, Button, Container, Header, Divider,  Grid, Menu, Segment } from 'semantic-ui-react';
import { withRouter } from 'react-router-dom';

import Whitelist from './Whitelist';
import ManageDataSources from './ManageDataSources';

class Setting extends Component {

  constructor() {
    super();
    this.state = { activeItem: 'datasources' }
  }

  handleItemClick = (e, { name }) => {
    this.setState({ activeItem: name })

  }

 render(){
  return (
    <Grid style={{ height: '100%' }}>
      <Grid.Column width={3}>
        <Menu vertical pointing fluid>
          <Menu.Item name='datasources' active={this.state.activeItem === 'datasources'} onClick={this.handleItemClick} >
          <Header as='h4'>Connectors</Header>
          <p>Manage connections to your SaaS Apps</p>
          </Menu.Item>
          <Menu.Item name='whitelist' active={this.state.activeItem === 'whitelist'} onClick={this.handleItemClick} >
          <Header as='h4'>Trusted Domains and Apps</Header>
          <p>Set your trusted domains and apps</p>
          </Menu.Item>
        </Menu>
      </Grid.Column>
       <Grid.Column stretched width={13}>
        {this.state.activeItem === 'datasources'?
          <ManageDataSources {...this.props} />
       :
         <Whitelist />

        }
      </Grid.Column>
    </Grid>
  )
}

}

export default withRouter(Setting);
