
import React, { Component } from 'react'
import { Button, Header, Modal, Form } from 'semantic-ui-react'
import { connect } from 'react-redux';

import authenticate from '../../utils/oauth';

import {
    USERS_RESOURCE_ACTION_CANCEL
} from '../../constants/actionTypes';
const mapStateToProps = state => ({
    action: state.users.action,
    selectedUser: state.users.selectedUserItem
});

const mapDispatchToProps = dispatch => ({
    onCancelAction: () =>
        dispatch({ type: USERS_RESOURCE_ACTION_CANCEL })
});

class UserActions extends Component {
    constructor(props) {
        super(props);
        this.state = {
            inProgress: false
        }
    }
    takeAction = (action) => (ev) => {
        ev.preventDefault();
        this.setState({ inProgress: true });
        authenticate("drive_action_scope").then(res => {
            action();
        }).catch(error => {
            this.setState({ inProgress: false });
        });
    }

    transferOwnership = (dataSource, user) => {
      console.log("Requesting for transfer ownership...")
  }

    transferOwnershipAction() {
        return (
            <Modal open={this.props.action} className="scrolling" >
                <Modal.Header>Action - Transfer Ownership</Modal.Header>
                <Modal.Content >
                    <Form.Input fluid label='From User' placeholder={this.props.selectedUser.key} readOnly />
                    <Form.Input fluid label='To User' placeholder="Enter the email..." readOnly />
                </Modal.Content>
                <Modal.Actions>
                    <Button negative onClick={this.props.onCancelAction}>Cancel</Button>
                    <Button positive loading={this.state.inProgress} labelPosition='right' 
                    icon='checkmark' content='Transfer' onClick={this.takeAction(this.transferOwnership)} />
                </Modal.Actions>
            </Modal>
        )
    }

    resourcePermissionChangeAction() {
        return (
            <Modal open={this.props.action} className="scrolling" >
                <Modal.Header>Action - Permission change</Modal.Header>
                <Modal.Content >
                    <Form.Input fluid label='User' placeholder={this.props.selectedUser.key} readOnly />
                    <Form.Input fluid label='File Name' placeholder={this.props.action.actionResource.name} readOnly />
                    <Form.Input fluid label='New Permission' placeholder={this.props.action.actionNewValue} readOnly />
                </Modal.Content>
                <Modal.Actions>
                    <Button negative onClick={this.props.onCancelAction}>Cancel</Button>
                    <Button positive loading={this.state.inProgress} labelPosition='right' 
                    icon='checkmark' content='Change' onClick={this.takeAction(this.transferOwnership)} />
                </Modal.Actions>
            </Modal>
        )

    }
    render() {
        if (this.props.action) {
            if (this.props.action.actionType === "transferOwnership") {
                return this.transferOwnershipAction()
            }
            else if (this.props.action.actionType === "resourcePermissionChange") {
                return this.resourcePermissionChangeAction()
            }
        }
        return null;
    }

}


export default connect(mapStateToProps, mapDispatchToProps)(UserActions);