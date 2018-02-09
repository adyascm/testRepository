import React, {Component} from 'react';
import {Tab} from 'semantic-ui-react';
import UserDetails from './UserDetails';
import UserAccess from './UserAccess';
import {connect} from 'react-redux';

const mapStateToProps = state => ({
    ...state.users
});

class UsersGroupsDetailsSection extends Component {
    constructor(props) {
        super(props);
    }

    render() {
        let parents = (this.props.selectedUserParents !== undefined)&&(this.props.selectedUserParents.length !== 0)? this.props.selectedUserParents:['None']

        let user = this.props.rowData? this.props.rowData["firstName"]?this.props.rowData["firstName"]+" "+this.props.rowData["lastName"]
                    : this.props.rowData["name"] : null
        let panes  = [
            { menuItem: 'Details', render: () => <Tab.Pane attached={false}><UserDetails user={user} parents={parents} /></Tab.Pane> },
            { menuItem: 'Resources', render: () => <Tab.Pane attached={false}><UserAccess /></Tab.Pane> },
            { menuItem: 'Activity', render: () => <Tab.Pane attached={false}>Get all activities from google</Tab.Pane> },
            
        ]
        return (
            <Tab menu={{ secondary: true, pointing: true }} panes={panes} /> 
        )
    }

}

export default connect(mapStateToProps)(UsersGroupsDetailsSection);