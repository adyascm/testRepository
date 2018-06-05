import React, { Component } from 'react';
import Mustache from 'mustache';
import { Button, Header, Modal, Form, Message, Dropdown } from 'semantic-ui-react'
import { RESOURCES_ACTION_CANCEL, RESOURCES_PAGE_LOAD_START, RESOURCES_PAGE_LOADED,
     USERS_RESOURCE_ACTION_CANCEL, USERS_PAGE_LOAD_START, USERS_PAGE_LOADED, USERS_OWNED_RESOURCES_LOAD_START, USERS_OWNED_RESOURCES_LOADED,
     USERS_RESOURCE_LOAD_START, USERS_RESOURCE_LOADED,
     LOGIN_SUCCESS, FLAG_ERROR_MESSAGE, APPS_ACTION_CANCEL, APPS_PAGE_LOAD_START, APPS_PAGE_LOADED } from '../../constants/actionTypes';
import { connect } from 'react-redux';
import agent from '../../utils/agent'
import oauth from '../../utils/oauth';

const mapStateToProps = state => ({
    ...state.resources,
    logged_in_user: state.common.currentUser,
    all_actions_list: state.common.all_actions_list,
    action: state.resources.action || state.users.action || state.apps.action,
    selectedUser: state.users.selectedUserItem,
    datasources: state.common.datasources,
    datasourcesMap: state.common.datasourcesMap
})

const mapDispatchToProps = dispatch => ({
    onCancelAction: () => {
        dispatch({ type: RESOURCES_ACTION_CANCEL })
        dispatch({ type: USERS_RESOURCE_ACTION_CANCEL })
        dispatch({ type: APPS_ACTION_CANCEL })
    },
    onCloseAction: (usersPayload, userOwnedResources, userAccessibleResources, resourcesPayload, appsPayload) => {
        dispatch({ type: RESOURCES_ACTION_CANCEL })
        dispatch({ type: USERS_RESOURCE_ACTION_CANCEL })
        dispatch({ type: APPS_ACTION_CANCEL })
        dispatch({ type: APPS_PAGE_LOAD_START });
        dispatch({ type: APPS_PAGE_LOADED, payload: appsPayload });
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
        var ds = this.props.datasourcesMap[action.datasource_id];
        let parameters = {};
        let all_actions_list = this.props.all_actions_list;
        let config_params = []
        for(let i in all_actions_list){
            if(all_actions_list[i]['key'] == action.key && all_actions_list[i]['datasource_type'] == ds.datasource_type){
                config_params = all_actions_list[i]['parameters'] 
            }   
        }

        config_params.map(e => { let key = e['key']; parameters[[key]] = this.state[e['key']]; });

        let payload = {}
        payload['key'] = this.state['key']
        payload['initiated_by'] = this.props.logged_in_user['email']
        payload['parameters'] = parameters
        payload['datasource_id'] = action.datasource_id

        return JSON.stringify(payload);
    }

    takeAction = (ev) => {
        ev.preventDefault();
        this.setState({
            ...this.state,
            inProgress: true
        });
        var ds = this.props.datasourcesMap[this.props.action.datasource_id];
        if (ds.datasource_type != "GSUITE" || this.props.logged_in_user.is_serviceaccount_enabled || this.props.logged_in_user.authorize_scope_name === "drive_action_scope") {
            this.executeAction(this.build_action_payload(), resp => {
                this.setState({
                    ...this.state,
                    inProgress: false,
                    successMessage: resp['message'],
                    logId:resp['id']
                });
            }, errorRes => {
                this.setState({
                    ...this.state,
                    inProgress: false,
                    errorMessage: errorRes['message'],
                    logId:errorRes['id']
                });
            });



        } else {
            oauth.authenticateGsuite("drive_action_scope").then(res => {
                //this.props.onIncrementalAuthComplete(res);
                this.executeAction(this.build_action_payload(), resp => {
                    this.setState({
                        ...this.state,
                        inProgress: false,
                        successMessage: resp['message'],
                        logId:resp['id']
                    });
                }, errorRes => {
                    this.setState({
                        ...this.state,
                        inProgress: false,
                        errorMessage: errorRes['message'],
                        logId:errorRes['id']
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
                let resp
                resp = err
                if(err.response.body)
                {
                    resp = err.response.body
                }
                error(resp)
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
        var appsPayload = agent.Apps.getapps()

        this.props.onCloseAction(usersPayload, userOwnedResources, userAccessibleResources, resourcesPayload, appsPayload);
    }

    componentWillReceiveProps(nextProps) {
        this.setState({
            ...nextProps.action,
            successMessage: undefined,
            errorMessage: undefined,
            logId:undefined
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
        let ds = this.props.datasourcesMap[this.props.action.datasource_id];
        let actionConfig = {}
        let all_actions_list = this.props.all_actions_list;

        for(let i in all_actions_list){
            if(all_actions_list[i]['key'] == action.key && all_actions_list[i]['datasource_type'] == ds.datasource_type){
                actionConfig = all_actions_list[i] 
            }   
        }


        let actionDescription = Mustache.render(actionConfig.description, action);
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
        let logmsg = (<div></div>)
        let submitAction = this.takeAction;
        let cancelButton = (<Button negative onClick={this.props.onCancelAction} content='Cancel' />);
        let submitButton = (<Button positive loading={this.state.inProgress} labelPosition='right' icon='checkmark' content='Submit'  />);
        if (this.state.successMessage) {
            if(this.state.logId){
                logmsg = (<a href="/auditlog">(Log:{this.state.logId})</a>)
            }
            message = (<Message
                success
            >{this.state.successMessage} {logmsg}</Message>)
            submitAction = this.onCloseAction;
            cancelButton = (<div></div>)
            submitButton = (<Button positive content='Close' />);
        }
        else if (this.state.errorMessage) {
            if(this.state.logId){
                logmsg = (<a href="/auditlog">(Log:{this.state.logId})</a>)
            }
            message = (<Message
                error
            >{this.state.errorMessage} {logmsg}</Message>)
            submitAction = this.onCloseAction;
            cancelButton = (<div></div>)
            submitButton = (<Button positive content='Close' />);
        }
        return (
            <Modal open={this.props.action !== undefined} className="scrolling" >
                <Modal.Header>Action - {actionConfig.name}</Modal.Header>
                <Modal.Content >
                    {message}
                    <Modal.Description><Header>{actionDescription}</Header></Modal.Description>
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
