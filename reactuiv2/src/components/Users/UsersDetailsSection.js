import React from 'react';
import {Tab} from 'semantic-ui-react';
import UserDetails from './UserDetails';
import UserAccess from './UserAccess';
import UserActivity from './UserActivity';

const UsersDetailsSection = props => {
    this.panes = [
        { menuItem: 'Details', render: () => <Tab.Pane attached={false}><UserDetails /></Tab.Pane> },
        { menuItem: 'Resources', render: () => <Tab.Pane attached={false}><UserAccess /></Tab.Pane> },
        { menuItem: 'Activity', render: () => <Tab.Pane attached={false}><UserActivity /></Tab.Pane> },

      ];

      return (
        <Tab menu={{ secondary: true, pointing: true }} panes={this.panes} />
      )
}

export default UsersDetailsSection;
