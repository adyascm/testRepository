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
    <Grid>
      <Grid.Column width={4}>
        <Menu fluid vertical tabular>
          <Menu.Item name='datasources' active={this.state.activeItem === 'datasources'} onClick={this.handleItemClick} />
          <Menu.Item name='whitelist' active={this.state.activeItem === 'whitelist'} onClick={this.handleItemClick} />
        </Menu>
      </Grid.Column>
      <Grid.Column stretched width={12}>
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
