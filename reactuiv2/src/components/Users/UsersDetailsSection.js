import React from 'react';
import {Tab} from 'semantic-ui-react';
import UserDetails from './UserDetails';
import UserAccess from './UserAccess';

const UsersDetailsSection = props => {
    this.panes = [
        { menuItem: 'Details', render: () => <Tab.Pane attached={false}><UserDetails /></Tab.Pane> },
        { menuItem: 'Resources', render: () => <Tab.Pane attached={false}><UserAccess /></Tab.Pane> },
        { menuItem: 'Activity', render: () => <Tab.Pane attached={false}>Get all activities from google</Tab.Pane> },
        
      ];
      
      return (
        <Tab menu={{ secondary: true, pointing: true }} panes={this.panes} /> 
      )
}

export default UsersDetailsSection;