import React, { Component } from 'react';
import { connect } from 'react-redux';
import PolicyCondition from './PolicyCondition'
import { Loader, Dimmer, Container, Segment, Form, Select, Header, Input, Checkbox, Button, Label, Icon, Modal } from 'semantic-ui-react';

import agent from '../../utils/agent';

import {
    SET_POLICY_FILTER,
    CREATE_POLICY_LOAD_START,
    CREATE_POLICY_LOADED,
    UPDATE_POLICY_FILTER,
    POLICY_LOAD_START,
    POLICY_LOADED
} from '../../constants/actionTypes';

import GroupSearch from '../Search/GroupSearch'


const mapStateToProps = state => ({
    ...state.policy,
    datasources: state.common.datasources,
    currentUser: state.common.currentUser,
    selectedUser: state.users.selectedUserItem
});

const mapDispatchToProps = dispatch => ({
    policyLoadStart: () =>
        dispatch({ type: POLICY_LOAD_START }),
    policyLoaded: (payload) =>
        dispatch({ type: POLICY_LOADED, payload })
});

class PolicyItemDetail extends Component {
    constructor(props) {
        super(props);
        this.state = {
            triggerType: "PERMISSION_CHANGE",
            conditions: [{ match_type: "DOCUMENT_NAME", match_condition: "equal", match_value: "" }],
            actions: [],
            name: "",
            description: "",
            policyId: undefined,
            showPolicyForm: false,
            To: '',
            isActive: true
        }
    }

    componentWillMount() {

        this.setState({
            policyTriggerType: [
                { text: 'Permission Change', value: 'PERMISSION_CHANGE' }],
            disableEmailField: true,
        })
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.showPolicyForm !== this.state.showPolicyForm) {
            if (nextProps.showPolicyForm && !nextProps.policyDetails) {
                this.setState({
                    triggerType: "PERMISSION_CHANGE",
                    conditions: [{ match_type: "DOCUMENT_NAME", match_condition: "equal", match_value: "" }],
                    actions: [],
                    name: "",
                    description: "",
                    policyId: undefined,
                    To: '',
                    disableEmailField: true,
                    showPolicyForm: nextProps.showPolicyForm,
                    isActive: true
                })
            }
            else
                this.setState({
                    showPolicyForm: nextProps.showPolicyForm
                })
        }

        if (nextProps.policyDetails && (nextProps.policyDetails !== this.props.policyDetails)) {
            let allActions = nextProps.policyDetails.actions
            if (allActions.length > 0) {
                let emailAction = allActions[0]
                let emailConfig = JSON.parse(emailAction.config)
                let disableEmailField = false
                this.setState({
                    To: emailConfig.to,
                    disableEmailField: disableEmailField
                })
            }
            this.setState({
                isActive: nextProps.policyDetails.is_active,
                name: nextProps.policyDetails.name,
                description: nextProps.policyDetails.description,
                triggerType: nextProps.policyDetails.trigger_type,
                conditions: nextProps.policyDetails.conditions,
                actions: allActions,
                policyId: nextProps.policyDetails.policy_id
            })
        }

        if (nextProps.selectedUser && (nextProps.selectedUser !== this.props.selectedUser)) {
            let emailAction = {
                action_type: 'SEND_EMAIL',
                config: {
                    to: nextProps.selectedUser.email
                }
            }
            let action = this.state.actions
            action.push(emailAction)
            this.setState({
                actions: action
            })
        }
        else if (!nextProps.selectedUser) {
            this.setState({
                actions: []
            })
        }
    }

    addPolicyCondition = () => {
        let conditions = this.state.conditions;
        conditions.push({ match_type: "DOCUMENT_NAME", match_condition: "equal", match_value: "" })
        this.setState({
            conditions: conditions
        })
    }

    removeFilter = (key) => {
        let conditions = this.state.conditions;
        conditions.splice(key, 1)
        this.setState({
            conditions: conditions
        })
    }

    sendEmailChange = () => {
        this.setState({
            disableEmailField: !this.state.disableEmailField
        })
    }

    handleInputEmailChange = (event, emailCategory) => {
        if (emailCategory === 'To') {
            this.setState({
                To: event.target.value
            })
        }
    }

    updateEmailAction = () => {
        let emailAction = {
            action_type: 'SEND_EMAIL',
            config: {
                to: this.state.To
            }
        }
        let action = this.state.actions
        action.push(emailAction)
        this.setState({
            actions: action
        })
    }

    handlePolicyTriggerTypeChange = (event, data) => {
        this.setState({
            triggerType: data.value
        })
    }

    handlePolicyNameChange = (event, data, type) => {
        if (type === 'name')
            this.setState({
                name: data.value
            })
        else
            this.setState({
                description: data.value
            })
    }

    handlePolicyActiveType = (event, data) => {
      this.setState({
        isActive: data.checked
      })
    }

    submitPolicyModalForm = () => {
        let policyInfo = {
            "datasource_id": this.props.datasources[0]["datasource_id"],
            "name": this.state.name,
            "description": this.state.description,
            "created_by": this.props.currentUser["email"],
            "trigger_type": this.state.triggerType,
            "conditions": this.state.conditions,
            "actions": this.state.actions,
            "is_active": this.state.isActive
        }

        this.props.policyLoadStart()
        if (!this.state.policyId)
            this.props.policyLoaded(agent.Policy.createPolicy(policyInfo))
        else
            this.props.policyLoaded(agent.Policy.updatePolicy(this.state.policyId, policyInfo))

        this.setState({
            showPolicyForm: false,
            policyDetails: undefined,
            policyId: undefined
        })
    }

    render() {
        let containerStyle = {
            height: "100%",
            textAlign: "left"
        };

        let emailFieldInput = (
            <Form.Group widths='equal'>
                {/* <Form.Field required control={Input} label='To' placeholder='Enter email...' value={this.state.To} onChange={(event) => this.handleInputEmailChange(event, 'To')} onBlur={this.updateEmailAction} /> */}
                {/* <Form.Field control={Input} label='CC' placeholder='Enter email...' onChange={(event) => this.props.sendEmail(event,'CC')} /> */}
                <Form.Field><GroupSearch defaultValue={this.state.To} /></Form.Field>
            </Form.Group>
        )

        let conditions = this.state.conditions.map((condition, index) => {
            return <PolicyCondition key={index} policyCondition={condition} index={index} removeFilter={this.removeFilter} />
        })

        if (this.props.isLoadingPolicy) {
            return (
                <Container style={containerStyle}>
                    <div className="ag-theme-fresh" style={{ height: '200px' }}>
                        <Dimmer active inverted>
                            <Loader inverted content='Loading' />
                        </Dimmer>
                    </div>
                </Container>
            )
        }
        else {
            return (
                <Modal size='large' className="scrolling" open={this.state.showPolicyForm}>
                    <Modal.Header>
                        Policy Details
                    </Modal.Header>
                    <Modal.Content>
                        <Form onSubmit={this.submitPolicyModalForm} >
                            <Segment.Group>
                                <Segment>
                                  <Form.Field>
                                    <Checkbox checked={this.state.isActive} onChange={(event, data) => this.handlePolicyActiveType(event, data)} label='IsActive' width={2}
                                    />
                                  </Form.Field>
                                    <Form.Group widths='equal'>
                                        <Form.Field required control={Input} label='Policy Name' placeholder='Specify a value' value={this.state.name} onChange={(event, data) => this.handlePolicyNameChange(event, data, 'name')} />
                                        <Form.Field required control={Input} label='Policy Description' placeholder='Specify a value' value={this.state.description} onChange={(event, data) => this.handlePolicyNameChange(event, data, 'description')} />
                                    </Form.Group>
                                    <Header as='h4' color='green'>TYPE</Header>
                                    <Form.Field required control={Select} label='Action' options={this.state.policyTriggerType} placeholder='Select an action...' value={this.state.triggerType} onChange={this.handlePolicyTriggerTypeChange} />
                                </Segment>
                                <Segment>
                                    <Header as='h4' color='yellow'>CONDITIONS</Header>
                                    {conditions}
                                    <div style={{ 'textAlign': 'center' }}>
                                        <Button basic color='green' onClick={this.addPolicyCondition}>Add Condition</Button>
                                    </div>
                                </Segment>
                                <Segment>
                                    <Header as='h4' color='red'>ACTIONS</Header>
                                    <Form.Field control={Checkbox} label='Send Email' onChange={this.sendEmailChange} checked={!this.state.disableEmailField} />
                                    {this.state.disableEmailField ? null : emailFieldInput}
                                </Segment>
                            </Segment.Group>
                            <Button negative onClick={this.props.closePolicyModalForm}>Close</Button>
                            <Button positive content='Submit'></Button>
                        </Form>
                    </Modal.Content>
                </Modal>
            )
        }

    }
}

export default connect(mapStateToProps, mapDispatchToProps)(PolicyItemDetail);
