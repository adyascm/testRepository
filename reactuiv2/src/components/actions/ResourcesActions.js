import React, { Component } from 'react';
import { Button, Header, Modal, Form } from 'semantic-ui-react'
import { RESOURCES_ACTION_CANCEL } from '../../constants/actionTypes';
import { connect } from 'react-redux';

const mapStateToProps = state => ({
    ...state.resources
})

const mapDispatchToProps = dispatch => ({
    onCancelAction: () =>
        dispatch({ type: RESOURCES_ACTION_CANCEL })
});

class ResourcesActions extends Component {
    constructor(props) {
        super(props);
    }

    transferOwnershipAction() {
        return (
            <Modal open={this.props.action} className="scrolling" >
                <Modal.Header>Action - Transfer Ownership</Modal.Header>
                <Modal.Content >
                    <Form.Input fluid label='From User' readOnly />
                    <Form.Input fluid label='To User' placeholder="Enter the email..." readOnly />
                </Modal.Content>
                <Modal.Actions>
                    <Button negative onClick={this.props.onCancelAction}>Cancel</Button>
                    <Button positive labelPosition='right' 
                    icon='checkmark' content='Transfer' />
                </Modal.Actions>
            </Modal>
        )
    }

    resourcePermissionChangeAction() {
        return (
            <Modal open={this.props.action} className="scrolling" >
                <Modal.Header>Action - Permission change</Modal.Header>
                <Modal.Content >
                    <Form.Input fluid label='User' readOnly />
                    <Form.Input fluid label='File Name' readOnly />
                    <Form.Input fluid label='New Permission' readOnly />
                </Modal.Content>
                <Modal.Actions>
                    <Button negative onClick={this.props.onCancelAction}>Cancel</Button>
                    <Button positive labelPosition='right' 
                    icon='checkmark' content='Change' />
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

export default connect(mapStateToProps,mapDispatchToProps)(ResourcesActions);