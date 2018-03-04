import React, { Component } from 'react';
import { Button, Header, Modal, Form, Message } from 'semantic-ui-react'
import { RESOURCES_ACTION_CANCEL, USERS_RESOURCE_ACTION_CANCEL, LOGIN_SUCCESS } from '../../constants/actionTypes';
import { connect } from 'react-redux';
import agent from '../../utils/agent'
import authenticate from '../../utils/oauth';

const mapStateToProps = state => ({
    ...state.resources,
    logged_in_user: state.common.currentUser,
    all_actions_list: state.common.all_actions_list,
    action: state.resources.action || state.users.action,
    selectedUser: state.users.selectedUserItem

})

const mapDispatchToProps = dispatch => ({
    onCancelAction: () => {
        dispatch({ type: RESOURCES_ACTION_CANCEL })
        dispatch({ type: USERS_RESOURCE_ACTION_CANCEL })
    },
    onIncrementalAuthComplete: (data) =>
        dispatch({ type: LOGIN_SUCCESS, ...data }),

});

class Actions extends Component {
    constructor(props) {
        super(props);
        this.state = {
            inProgress: false,
            initiated_by: props.logged_in_user['email']
        };
        this.takeAction = this.takeAction.bind(this);
        this.executeAction = this.executeAction.bind(this);
        this.onUpdateParameters = this.onUpdateParameters.bind(this);
    }

    takeAction = (ev) => {
        ev.preventDefault();
        this.setState({
            ...this.state,
            inProgress: true
        });
        if (this.props.logged_in_user.authorize_scope_name !== "drive_action_scope") {
            authenticate("drive_action_scope").then(res => {
                this.props.onIncrementalAuthComplete(res);
                this.executeAction(JSON.stringify(this.state));
            }).catch(error => {
                this.setState({
                    ...this.state,
                    inProgress: false,
                    errorMessage: error['message']
                });
            });
        } else {
            this.executeAction(JSON.stringify(this.state), resp => {
                this.setState({
                    ...this.state,
                    inProgress: false,
                    successMessage: resp['message']
                });
            }, error => {
                this.setState({
                    ...this.state,
                    inProgress: false,
                    errorMessage: error['message']
                });
            });
        }
    }

    executeAction = (payload, success, error) => {
        agent.Actions.initiateAction(payload)
            .then(resp => {
                success(resp)
            }).catch(error => {
                error(error)
            })
    }
    onUpdateParameters = key => e => {
        this.state[key] = e.target.value;
        this.setState({
            ...this.state
        });
    }

    componentWillReceiveProps(nextProps) {
        this.setState({
            ...nextProps.action
        })
    }

    render() {
        let action = this.props.action;
        if (!action)
            return null;
        let actionConfig = this.props.all_actions_list[action.key];
        let formFields = actionConfig.parameters.map(field => {
            if (field.hidden)
                return null;
            return (<Form.Input fluid label={field.label}
                key={field.key}
                onChange={this.onUpdateParameters(field.key)}
                value={this.state[field.key]}
                readOnly={!field.editable} required={field.editable !== 0? true: false} />)
        });
        let message = (<div></div>)
        if (this.state.successMessage) {
            message = (<Message
                success
                content={this.state.successMessage}
            />)
        }
        else if (this.state.errorMessage) {
            message = (<Message
                error
                content={this.state.errorMessage}
            />)
        }
        return (
            <Modal open={this.props.action != undefined} className="scrolling" >
                <Modal.Header>Action - {actionConfig.name}</Modal.Header>
                <Modal.Content >
                    {message}
                    <Modal.Description><Header>{actionConfig.description}</Header></Modal.Description>
                    <Form onSubmit={this.takeAction}>
                        {formFields}
                        <Button negative onClick={this.props.onCancelAction} content='Cancel' />
                        <Button positive loading={this.state.inProgress} labelPosition='right'
                            icon='checkmark' content='Submit' />
                    </Form>
                </Modal.Content>
            </Modal>
        )
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(Actions);
