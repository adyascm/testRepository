import React, {Component} from 'react';
import {Tab} from 'semantic-ui-react';
import ResourcePermissions from './ResourcePermissions';

class ResourcePermissionSection extends Component {
    constructor(props) {
        super(props);
        this.state = {
            panes: [
                { menuItem: 'Permissions', render: () => <Tab.Pane attached={false}><ResourcePermissions /></Tab.Pane> }   
              ]
        }
    }

    render() {

        return (
            <Tab menu={{ secondary: true, pointing: true }} panes={this.state.panes} />
        )
    }
}

export default ResourcePermissionSection;