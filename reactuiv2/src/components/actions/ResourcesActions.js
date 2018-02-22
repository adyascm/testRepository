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
                {/* <Modal.Header>Action - Transfer Ownership</Modal.Header> */}
                <Modal.Header>Action - {this.props.action['actionNewValue']}</Modal.Header>
                <Modal.Content >
                    <Form.Input fluid label='For File Name' placeholder={this.props.rowData['resourceName']} readOnly />
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

    otherQuickActions() {
        return (
            <Modal open={this.props.action} className="scrolling" >
                {/* <Modal.Header>Action - Transfer Ownership</Modal.Header> */}
                <Modal.Header>Action - {this.props.action['actionNewValue']}</Modal.Header>
                <Modal.Content >
                    <Form.Input fluid label='For File Name' placeholder={this.props.rowData['resourceName']} readOnly />
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
                    <Form.Input fluid label='User' placeholder={this.props.action['actionEmail']} readOnly />
                    <Form.Input fluid label='File Name' placeholder={this.props.rowData['resourceName']} readOnly />
                    <Form.Input fluid label='New Permission' placeholder={this.props.action['actionNewValue']} readOnly />
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
            else {
                return this.otherQuickActions()
            }
        }
        return null;
    }
}

export default connect(mapStateToProps,mapDispatchToProps)(ResourcesActions);