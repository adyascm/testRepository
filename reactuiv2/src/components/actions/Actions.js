import React, { Component } from 'react';
import { Button, Header, Modal, Form, Message, Dropdown } from 'semantic-ui-react'
import { RESOURCES_ACTION_CANCEL, RESOURCES_PAGE_LOAD_START, RESOURCES_PAGE_LOADED,
     USERS_RESOURCE_ACTION_CANCEL, USERS_PAGE_LOAD_START, USERS_PAGE_LOADED, USERS_OWNED_RESOURCES_LOAD_START, USERS_OWNED_RESOURCES_LOADED,
     USERS_RESOURCE_LOAD_START, USERS_RESOURCE_LOADED,
     LOGIN_SUCCESS, FLAG_ERROR_MESSAGE } from '../../constants/actionTypes';
import { connect } from 'react-redux';
import agent from '../../utils/agent'
import authenticate from '../../utils/oauth';

const mapStateToProps = state => ({
    ...state.resources,
    logged_in_user: state.common.currentUser,
    all_actions_list: state.common.all_actions_list,
    action: state.resources.action || state.users.action,
    selectedUser: state.users.selectedUserItem,
    datasources: state.common.datasources
})

const mapDispatchToProps = dispatch => ({
    onCancelAction: () => {
        dispatch({ type: RESOURCES_ACTION_CANCEL })
        dispatch({ type: USERS_RESOURCE_ACTION_CANCEL })
    },
    onCloseAction: (usersPayload, userOwnedResources, userAccessibleResources, resourcesPayload) => {
        dispatch({ type: RESOURCES_ACTION_CANCEL })
        dispatch({ type: USERS_RESOURCE_ACTION_CANCEL })
        dispatch({ type: USERS_PAGE_LOAD_START });
        dispatch({ type: USERS_PAGE_LOADED, payload: usersPayload });
        if(userOwnedResources)
        {
            dispatch({ type: USERS_OWNED_RESOURCES_LOAD_START });
            dispatch({ type: USERS_OWNED_RESOURCES_LOADED, payload: userOwnedResources });
        }
        if(userAccessibleResources)
        {
            dispatch({ type: USERS_RESOURCE_LOAD_START });
            dispatch({ type: USERS_RESOURCE_LOADED, payload: userAccessibleResources });
        }
        dispatch({ type: RESOURCES_PAGE_LOAD_START });
        dispatch({ type: RESOURCES_PAGE_LOADED, payload: resourcesPayload });
    },
    onIncrementalAuthComplete: (data) =>
        dispatch({ type: LOGIN_SUCCESS, ...data }),
    onActionNotAllowed: (errorMessage) =>
        dispatch({ type: FLAG_ERROR_MESSAGE, error: errorMessage }),
});

class Actions extends Component {
    constructor(props) {
        super(props);
        this.state = {
            inProgress: false,
            initiated_by: props.logged_in_user['email'],
            permissionDropdown: [
                    { text: 'Can Read', value: 'reader' },
                    { text: 'Can Write', value: 'writer' },
                    { text: 'Owner', value: 'owner' }
                ]
        };
        this.takeAction = this.takeAction.bind(this);
        this.executeAction = this.executeAction.bind(this);
        this.onUpdateParameters = this.onUpdateParameters.bind(this);
        this.onCloseAction = this.onCloseAction.bind(this);
    }

    build_action_payload = () => {
        let action = this.props.action;

        let parameters = {};
        let config_params = this.props.all_actions_list[action.key].parameters;

        config_params.map(e => { let key = e['key']; parameters[[key]] = this.state[e['key']]; });


        let payload = {}
        payload['key'] = this.state['key']
        payload['initiated_by'] = this.props.logged_in_user['email']
        payload['parameters'] = parameters

        return JSON.stringify(payload);
    }

    takeAction = (ev) => {
        ev.preventDefault();
        this.setState({
            ...this.state,
            inProgress: true
        });
        if (this.props.logged_in_user.is_serviceaccount_enabled || this.props.logged_in_user.authorize_scope_name === "drive_action_scope") {
            this.executeAction(this.build_action_payload(), resp => {
                this.setState({
                    ...this.state,
                    inProgress: false,
                    successMessage: resp['message']
                });
            }, errorMsg => {
                this.setState({
                    ...this.state,
                    inProgress: false,
                    errorMessage: errorMsg
                });
            });



        } else {
            authenticate("drive_action_scope").then(res => {
                //this.props.onIncrementalAuthComplete(res);
                this.executeAction(this.build_action_payload(), resp => {
                    this.setState({
                        ...this.state,
                        inProgress: false,
                        successMessage: resp['message']
                    });
                }, errorMsg => {
                    this.setState({
                        ...this.state,
                        inProgress: false,
                        errorMessage: errorMsg
                    });
                });
            }).catch(error => {
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
            }).catch(err => {
                var message = err.message;
                if(err.response.body)
                {
                    message = err.response.body.message
                }
                error(message)
            })
    }
    onUpdateParameters = key => e => {
        this.state[key] = e.target.value;
        this.setState({
            ...this.state
        });
    }

    onCloseAction = () => {
        var usersPayload = agent.Users.getUsersTree();
        var userOwnedResources = undefined;
        var userAccessibleResources = undefined;
        if(this.props.selectedUser)
        {
            if(this.props.selectedUser.ownedResources)
            {
                userOwnedResources = agent.Resources.getResourcesTree({ 'userEmails': [this.props.selectedUser["key"]], 'pageNumber': 0, 'pageSize': 100, 'ownerEmailId': this.props.selectedUser["key"] });
            
            }if(this.props.selectedUser.resources)
            {
                userAccessibleResources = agent.Resources.getResourcesTree({'userEmails': [this.props.selectedUser["key"]], 'exposureType': this.props.filterExposureType, 'pageNumber': this.props.pageNumber, 'pageSize': this.props.pageLimit});    
            }
        }
        
        var resourcesPayload = agent.Resources.getResourcesTree({ 'userEmails': [], 'exposureType': this.props.filterExposureType, 'resourceType': this.props.filterResourceType, 'pageNumber': this.props.pageNumber, 'pageSize': this.props.pageLimit });

        this.props.onCloseAction(usersPayload, userOwnedResources, userAccessibleResources, resourcesPayload);
    }

    componentWillReceiveProps(nextProps) {
        this.setState({
            ...nextProps.action,
            successMessage: undefined,
            errorMessage: undefined
        })
    }

    render() {
        let action = this.props.action;
        if (!action)
            return null;
        if (this.props.datasources[0].is_dummy_datasource) {
            //Actions are not allowed
            this.props.onActionNotAllowed("Actions are not allowed, please contact your administrator.")
            return null;
        }
        let actionConfig = this.props.all_actions_list[action.key];
        let formFields = actionConfig.parameters.map(field => {
            if (field.hidden)
                return null;
            return (<Form.Input fluid label={field.label}
                key={field.key}
                onChange={this.onUpdateParameters(field.key)}
                value={this.state[field.key]}
                readOnly={!field.editable} required={field.editable !== 0 ? true : false} />)
        });
        let message = (<div></div>)
        let submitAction = this.takeAction;
        let cancelButton = (<Button negative onClick={this.props.onCancelAction} content='Cancel' />);
        let submitButton = (<Button positive loading={this.state.inProgress} labelPosition='right' icon='checkmark' content='Submit'  />);
        if (this.state.successMessage) {
            message = (<Message
                success
                content={this.state.successMessage}
            />)
            submitAction = this.onCloseAction;
            cancelButton = (<div></div>)
            submitButton = (<Button positive content='Close' />);
        }
        else if (this.state.errorMessage) {
            message = (<Message
                error
                content={this.state.errorMessage}
            />)
            submitAction = this.onCloseAction;
            cancelButton = (<div></div>)
            submitButton = (<Button positive content='Close' />);
        }
        return (
            <Modal open={this.props.action !== undefined} className="scrolling" >
                <Modal.Header>Action - {actionConfig.name}</Modal.Header>
                <Modal.Content >
                    {message}
                    <Modal.Description><Header>{actionConfig.description}</Header></Modal.Description>
                    <Form onSubmit={submitAction}>
                        {formFields}
                        {cancelButton}
                        {submitButton}
                    </Form>
                </Modal.Content>
            </Modal>
        )
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(Actions);
