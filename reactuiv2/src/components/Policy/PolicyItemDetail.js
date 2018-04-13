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


const mapStateToProps = state => ({
    ...state.policy,
    datasources: state.common.datasources,
    currentUser: state.common.currentUser
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
            triggerType: "",
            conditions: [{match_type: "", match_condition: "", match_value: ""}],
            actions: [],
            name: "",
            description: "",
            policyId: undefined,
            showPolicyForm: false
        }
    }

    componentWillMount() {
        
        this.setState({
            policyTriggerType: [
                { text: '', value: '' },
                { text: 'Permission Change', value: 'PERMISSION_CHANGE' }],
            disableEmailField: true,
        })
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.showPolicyForm !== this.state.showPolicyForm)
            this.setState({
                showPolicyForm: nextProps.showPolicyForm
            })
        if (nextProps.policyDetails !== this.props.policyDetails) {
            this.setState({
                name: nextProps.policyDetails?nextProps.policyDetails.name:'',
                description: nextProps.policyDetails?nextProps.policyDetails.description:'',
                triggerType: nextProps.policyDetails?nextProps.policyDetails.trigger_type:'',
                conditions: nextProps.policyDetails?nextProps.policyDetails.conditions:[{match_type: "", match_condition: "", match_value: ""}],
                actions: nextProps.policyDetails?nextProps.policyDetails.actions:[],
                policyId: nextProps.policyDetails?nextProps.policyDetails.policy_id:undefined
            })
        }
    }

    addPolicyCondition = () => {
        let conditions = this.state.conditions;
        conditions.push({match_type: "", match_condition: "", match_value: ""})
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
        if (emailCategory === 'To')
            this.setState({
                'To': event.target.value
            })
    }

    handlePolicyTriggerTypeChange = (event,data) => {
        this.setState({
            triggerType: data.value
        })
    }

    handlePolicyNameChange = (event,data,type) => {
        if (type === 'name')
            this.setState({
                name: data.value
            })
        else 
            this.setState({
                description: data.value
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
            "actions": this.state.actions
        }

        this.props.policyLoadStart()
        if (!this.state.policyId)
            this.props.policyLoaded(agent.Policy.createPolicy(policyInfo))
        else 
            this.props.policyLoaded(agent.Policy.updatePolicy(this.state.policyId,policyInfo))
        
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
                <Form.Field control={Input} label='To' placeholder='Enter email...' value={this.state.To} onChange={(event) => this.handleInputEmailChange(event,'To')}  />
                {/* <Form.Field control={Input} label='CC' placeholder='Enter email...' onChange={(event) => this.props.sendEmail(event,'CC')} /> */}
            </Form.Group>
        )

        let conditions = this.state.conditions.map((condition, index) => {
            return <PolicyCondition policyCondition={condition} index={index} removeFilter={this.removeFilter} />
        })

        if (this.props.isLoading) {
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
            let modalContent = (
                <Container style={containerStyle}>
                    <Form>
                        <Segment.Group>
                            <Segment>
                                <Form.Group widths='equal'>
                                    <Form.Field control={Input} label='Policy Name' placeholder='Specify a value' value={this.state.name} onChange={(event,data) => this.handlePolicyNameChange(event,data,'name')}  />
                                    <Form.Field control={Input} label='Policy Description' placeholder='Specify a value' value={this.state.description} onChange={(event,data) => this.handlePolicyNameChange(event,data,'description')}  />
                                </Form.Group>
                                <Header as='h4' color='green'>WHEN</Header>
                                <Form.Field control={Select} label='Action' options={this.state.policyTriggerType} placeholder='Select an action...' value={this.state.triggerType} onChange={this.handlePolicyTriggerTypeChange} />
                            </Segment>
                            <Segment>
                                <Header as='h4' color='yellow'>IF</Header>
                                {/* <PolicyCondition /> */}
                                {conditions}
                                <div style={{'textAlign': 'center'}}>
                                    <Button basic color='green' onClick={this.addPolicyCondition}>Add Filter</Button>
                                </div>
                            </Segment>
                            <Segment>
                                <Header as='h4' color='red'>THEN</Header>
                                <Form.Field control={Checkbox} label='Send Email' onChange={this.sendEmailChange} checked={!this.state.disableEmailField} />
                                {this.state.disableEmailField?null:emailFieldInput}
                            </Segment>
                        </Segment.Group>
                    </Form>
                </Container>
            )
            return (
                <Modal size='large' className="scrolling" open={this.state.showPolicyForm}>
                    <Modal.Header>
                        Policy Form
                    </Modal.Header>
                    <Modal.Content>
                        {/* <PolicyItemDetail policyDetails={this.state.policyDetails} /> */}
                        {/* <PolicyDetails /> */}
                        {modalContent}
                    </Modal.Content>
                    <Modal.Actions>
                        <Button negative onClick={this.props.closePolicyModalForm}>Close</Button>
                        <Button positive onClick={this.submitPolicyModalForm}>Submit</Button>
                    </Modal.Actions>
                </Modal>
            )
        }

    }
}

export default connect(mapStateToProps, mapDispatchToProps)(PolicyItemDetail);