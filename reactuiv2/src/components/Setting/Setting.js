import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Card, Button, Container, Header, Divider, Grid, Menu, Segment } from 'semantic-ui-react';
import { withRouter } from 'react-router-dom';

import Whitelist from './Whitelist';
import ManageDataSources from './ManageDataSources';
import AuditLogTable from '../AuditLogTable';
import TrustedDomains from './TrustedDomains';

class Setting extends Component {

  constructor() {
    super();
    this.state = { activeItem: 'datasources' }
  }

  handleItemClick = (e, { name }) => {
    this.setState({ activeItem: name })

  }

  render() {
    var detailsPage = null;
    if (this.state.activeItem === 'datasources') {
      detailsPage = <ManageDataSources {...this.props} />
    }
    else if (this.state.activeItem === 'whitelist') {
      // detailsPage = <Whitelist />
      detailsPage = <TrustedDomains />
    }
    else if (this.state.activeItem === 'auditlogs') {
      detailsPage = <AuditLogTable />
    }
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
            <Menu.Item name='auditlogs' active={this.state.activeItem === 'auditlogs'} onClick={this.handleItemClick} >
              <Header as='h4'>Audit Logs</Header>
              <p>Logs of all actions performed on Adya</p></Menu.Item>
          </Menu>
        </Grid.Column>
        <Grid.Column stretched width={13}>
          {detailsPage}
        </Grid.Column>
      </Grid>
    )
  }

}

export default withRouter(Setting);
