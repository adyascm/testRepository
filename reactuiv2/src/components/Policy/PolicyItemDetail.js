import React, { Component } from 'react';
import { connect } from 'react-redux';
import PolicyCondition from './PolicyCondition'
import { Loader, Dimmer, Container, Segment, Form, Select, Header, Input, Checkbox, Button, Label, Icon, Modal, TextArea } from 'semantic-ui-react';
import MultiUserSelect from '../MultiUserSelect'
import agent from '../../utils/agent';

import {
    SET_POLICY_FILTER,
    CREATE_POLICY_LOAD_START,
    CREATE_POLICY_LOADED,
    UPDATE_POLICY_FILTER,
    POLICY_LOAD_START,
    POLICY_LOADED,
    UPDATE_POLICY_ACTION_EMAIL
} from '../../constants/actionTypes';

import GroupSearch from '../Search/GroupSearch'
import UserTagging from '../UserTagging';


const mapStateToProps = state => ({
    ...state.policy,
    datasources: state.common.datasources,
    currentUser: state.common.currentUser,
    // selectedUser: state.users.selectedUserItem
});

const mapDispatchToProps = dispatch => ({
    policyLoadStart: () =>
        dispatch({ type: POLICY_LOAD_START }),
    policyLoaded: (payload) =>
        dispatch({ type: POLICY_LOADED, payload }),
    updateActionEmail: (actionType, email='') => 
        dispatch({ type: UPDATE_POLICY_ACTION_EMAIL, actionType, email })
});

class PolicyItemDetail extends Component {
    constructor(props) {
        super(props);
        this.state = {
            triggerType: "PERMISSION_CHANGE",
            conditions: [{ match_type: "DOCUMENT_NAME", match_condition: "equal", match_value: "" }],
            actions: [],
            name: "",
            severity:"HIGH",
            description: "",
            policyId: undefined,
            showPolicyForm: false,
            To: '',
            isActive: true,
            datasource_id:this.props.datasources[0]["datasource_id"]
        }
    }

    componentWillMount() {
        let datasourceType = []
        this.props.datasources.map((datasource,index) => {
            datasourceType.push({"text":datasource["datasource_type"],"value":datasource["datasource_id"]})
        })

        this.setState({
            policyTriggerType: [
                { text: 'Permission Change', value: 'PERMISSION_CHANGE' },
                { text: 'Application Install', value: 'APP_INSTALL' },
                {text: 'New User', value: 'NEW_USER'}],
            disableEmailField: true,
            revertOnAlert: false,
            severityType: [
                { text: 'High', value: 'HIGH' },
                { text: 'Medium', value: 'MEDIUM' },
                { text: 'Low', value: 'LOW' }
            ],
            datasourceType:datasourceType
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
                    isActive: true,
                    severity:"HIGH",
                    datasource_id:this.props.datasources[0]["datasource_id"],
                    revertOnAlert: false
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
                for (let action in allActions){
                  let actioninfo = allActions[action]
                  let actionType = actioninfo["action_type"]
                  if (actionType == 'SEND_EMAIL'){
                    let emailConfig = JSON.parse(actioninfo.config)
                    let disableEmailField = false
                    let sendEmailAction = {
                      action_type: 'SEND_EMAIL',
                      config: {
                          to: emailConfig.to
                      }
                    }
                    let action = this.state.actions
                    action.push(sendEmailAction)
                    this.setState({
                        To: emailConfig.to,
                        disableEmailField: disableEmailField,
                        actions: action
                    })
                    let emails = emailConfig.to.split(",")
                    this.props.updateActionEmail('SETMULTIPLE', emails)
                  }
                else if (actionType == "REVERT") {
                  let revertBackAction = {
                      action_type: 'REVERT'
                  }
                  let action = this.state.actions
                  action.push(revertBackAction)
                    this.setState({
                      revertOnAlert: true,
                      actions: action
                    })
                }

                }
            }
            this.setState({
                isActive: nextProps.policyDetails.is_active,
                name: nextProps.policyDetails.name,
                description: nextProps.policyDetails.description,
                triggerType: nextProps.policyDetails.trigger_type,
                conditions: nextProps.policyDetails.conditions,
                //actions: allActions,
                policyId: nextProps.policyDetails.policy_id,
                severity: nextProps.policyDetails.severity,
                datasource_id:nextProps.policyDetails.datasource_id,
            })
        }

        // if (nextProps.selectedUser && (nextProps.selectedUser !== this.props.selectedUser)) {
        //     let emailAction = {
        //         action_type: 'SEND_EMAIL',
        //         config: {
        //             to: nextProps.selectedUser.email
        //         }
        //     }
        //     let action = this.state.actions
        //     action.push(emailAction)
        //     this.setState({
        //         actions: action
        //     })
        // }
        if (nextProps.actionEmail && (nextProps.actionEmail !== this.props.actionEmail)) {
            let emailAction = {
                action_type: 'SEND_EMAIL',
                config: {
                    to: nextProps.actionEmail.join(",")
                }
            }
            let action = this.state.actions
            let actionIndex = -1
            for (let index in action) {
                if (action[index].action_type === 'SEND_EMAIL') {
                    actionIndex = index
                    break
                }
            }
            if (actionIndex !== -1)
                action.splice(actionIndex, 1)
            action.push(emailAction)
            this.setState({
                actions: action
            })
        }
    }

    addPolicyCondition = () => {
        this.setState(prevState => ({
            conditions: [...prevState.conditions, { match_type: "DOCUMENT_NAME", match_condition: "equal", match_value: "" }]
        }))
    }

    removeFilter = (key) => {
        let conditions = [...this.state.conditions]
        conditions.splice(key,1)
        this.setState({
            conditions: conditions
        })
    }

    sendEmailChange = () => {
        this.setState({
            disableEmailField: !this.state.disableEmailField
        })
    }

    handlePolicyRevertType = () => {
      let actions = this.state.actions
      let revertOnAlert = !this.state.revertOnAlert
      if (revertOnAlert == true){
        let revertAction = {
            action_type: 'REVERT'
        }
         actions.push(revertAction)
      }
      else {
        for(let action in actions){
          if(actions[action]['action_type'] == 'REVERT'){
            actions.splice(action, 1)
          }
        }
      }
      this.setState({
          revertOnAlert: revertOnAlert,
          actions: actions
      })
    }

    // handleInputEmailChange = (event, emailCategory) => {
    //     if (emailCategory === 'To') {
    //         this.setState({
    //             To: event.target.value
    //         })
    //     }
    // }

    // updateEmailAction = () => {
    //     let emailAction = {
    //         action_type: 'SEND_EMAIL',
    //         config: {
    //             to: this.state.To
    //         }
    //     }
    //     let action = this.state.actions
    //     action.push(emailAction)
    //     this.setState({
    //         actions: action
    //     })
    // }

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

    handleSeverityChange = (event , data) => {
        this.setState({
            severity: data.value
        })
    }
    handleDataSourceChange = (event, data) => {
        this.setState({
            datasource_id: data.value
        })
    }

    submitPolicyModalForm = () => {
        let policyInfo = {
            "datasource_id": this.state.datasource_id,
            "name": this.state.name,
            "description": this.state.description,
            "created_by": this.props.currentUser["email"],
            "trigger_type": this.state.triggerType,
            "conditions": this.state.conditions,
            "actions": this.state.actions,
            "is_active": this.state.isActive,
            "severity":this.state.severity,
            "datasource_id":this.state.datasource_id
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
        this.props.updateActionEmail('CLEAR')
    }

    render() {
        let containerStyle = {
            height: "100%",
            textAlign: "left"
        };

        let emailFieldInput = (
            <Form.Group widths='equal'>
                {/* <Form.Field><GroupSearch defaultValue={this.state.To} /></Form.Field> */}
                {/* <Form.Field><MultiUserSelect email={this.state.To} /></Form.Field> */}
                <Form.Field><UserTagging datasource={this.state.datasource_id} /></Form.Field>
            </Form.Group>
        )

        let conditions = this.state.conditions.map((condition, index) => {
            return <PolicyCondition key={Math.random()} policyCondition={condition} index={index} removeFilter={this.removeFilter} />
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
                                <Form.Group widths='equal'>
                                  <Form.Field>
                                    <Checkbox checked={this.state.isActive} onChange={(event, data) => this.handlePolicyActiveType(event, data)} label='Active' width={2}
                                    /></Form.Field>
                                    <Form.Field inline control={Select} label="Connector" options={this.state.datasourceType} placeholder='Select connector...' value={this.state.datasource_id} onChange={(event, data) => this.handleDataSourceChange(event, data)} />
                                    <Form.Field inline control={Select} label="Severity" options={this.state.severityType} placeholder='Select severity level...' value={this.state.severity} onChange={(event, data) => this.handleSeverityChange(event, data)} />
                                    </Form.Group>
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
                                    <Form.Field control={Checkbox} label='Revert on Alert' onChange={this.handlePolicyRevertType} checked={this.state.revertOnAlert} />
                                    <Form.Field control={Checkbox} label='Send Email To' onChange={this.sendEmailChange} checked={!this.state.disableEmailField} />
                                    {this.state.disableEmailField ? null : emailFieldInput}
                                </Segment>
                            </Segment.Group>
                            <Button negative onClick={this.props.closePolicyModalForm}>Close</Button>
                            <Button positive content='Submit' disabled={!this.state.disableEmailField && (!this.props.actionEmail || !this.props.actionEmail.length)}></Button>
                        </Form>
                    </Modal.Content>
                </Modal>
            )
        }

    }
}

export default connect(mapStateToProps, mapDispatchToProps)(PolicyItemDetail);
