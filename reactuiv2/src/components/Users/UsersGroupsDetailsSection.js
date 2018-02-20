import React, { Component } from 'react';
import { Tab, Segment, Sticky, Icon } from 'semantic-ui-react';
import UserDetails from './UserDetails';
import UserResource from './UserResource';
import UserActivity from './UserActivity';
import { connect } from 'react-redux';
import {
    USER_ITEM_SELECTED
} from '../../constants/actionTypes';

const mapStateToProps = state => ({
    ...state.users,
    ...state.common
});

const mapDispatchToProps = dispatch => ({
    closingDetailsSection: (payload) => dispatch({type:USER_ITEM_SELECTED,payload})
})

class UsersGroupsDetailsSection extends Component {
    constructor(props) {
        super(props);
        this.closeDetailsSection = this.closeDetailsSection.bind(this);
    }

    closeDetailsSection() {
        this.props.closingDetailsSection(undefined)
    }

    render() {
        if (!this.props.selectedUserItem)
            return null;
        else {
            let panes = [
                { menuItem: 'Resources', render: () => <Tab.Pane attached={false}><UserResource /></Tab.Pane> },
                { menuItem: 'Activity', render: () => <Tab.Pane attached={false}><UserActivity /></Tab.Pane> }
            ]
            return (
                <Segment>
                    <Sticky>
                        <Icon name='close' onClick={this.closeDetailsSection} />
                        <UserDetails selectedUserItem={this.props.selectedUserItem} usersTreePayload={this.props.usersTreePayload}/>
                        <Tab menu={{ secondary: true, pointing: true }} panes={panes} />
                    </Sticky>
                </Segment>
            )
        }

    }

}

export default connect(mapStateToProps,mapDispatchToProps)(UsersGroupsDetailsSection);
