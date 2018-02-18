import React, { Component } from 'react';
import { Tab, Segment, Sticky } from 'semantic-ui-react';
import UserDetails from './UserDetails';
import UserResource from './UserResource';
import UserActivity from './UserActivity';
import { connect } from 'react-redux';

const mapStateToProps = state => ({
    ...state.users,
    ...state.common
});

class UsersGroupsDetailsSection extends Component {
    constructor(props) {
        super(props);
    }

    render() {
        if (!this.props.selectedUserItem)
            return null;
        else {
            let panes = [
                { menuItem: 'Resources', render: () => <Tab.Pane attached={false}><UserResource /></Tab.Pane> },
                { menuItem: 'Activity', render: () => <Tab.Pane attached={false}><UserActivity /></Tab.Pane> },

            ]
            return (
                <Segment>
                    <Sticky>
                    <UserDetails selectedUserItem={this.props.selectedUserItem} usersTreePayload={this.props.usersTreePayload}/>
                    <Tab menu={{ secondary: true, pointing: true }} panes={panes} />
                </Sticky>
                </Segment>
            )
        }

    }

}

export default connect(mapStateToProps)(UsersGroupsDetailsSection);
