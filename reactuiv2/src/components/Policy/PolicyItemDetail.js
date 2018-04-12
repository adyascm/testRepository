import React, { Component } from 'react';
import { connect } from 'react-redux';
import PolicyCondition from './PolicyCondition'
import { Loader, Dimmer, Container, Segment, Form, Select, Header, Input, Checkbox, Button, Label, Icon } from 'semantic-ui-react';

import agent from '../../utils/agent';

import {
    SET_POLICY_FILTER,
    CREATE_POLICY_LOAD_START,
    CREATE_POLICY_LOADED,
    UPDATE_POLICY_FILTER
} from '../../constants/actionTypes';


const mapStateToProps = state => ({
    ...state.policy
});

const mapDispatchToProps = dispatch => ({
    setPolicyFilter: (policyFilterType, policyFilterValue) => 
        dispatch({ type: SET_POLICY_FILTER, policyFilterType, policyFilterValue }),
    updatePolicyFilter: (payload) =>
        dispatch({ type: UPDATE_POLICY_FILTER, payload })
});

class PolicyItemDetail extends Component {
    constructor(props) {
        super(props);
        this.state = {
            triggerType: props.policyDetails != null ? props.policyDetails.triggerType : "",
            conditions: props.policyDetails != null ? props.policyDetails.conditions : [{match_type: "", match_condition: "", match_value: ""}],
            actions: props.policyDetails != null ? props.policyDetails.actions : [],
            name: props.policyDetails != null ? props.policyDetails.name : "",
            description: props.policyDetails != null ? props.policyDetails.description : "",
        }
    }

    componentWillMount() {
        
        this.setState({
            policyTriggerType: [
                { text: '', value: '' },
                { text: 'Permission Change', value: 'PERMISSION_CHANGE' }],
            // filterTypeOptions: [
            //     { text: '', value: '' },
            //     { text: 'Document.Name', value: 'DOCUMENT_NAME' },
            //     { text: 'Document.Owner', value: 'DOCUMENT_OWNER' },
            //     { text: 'Document.Exposure', value: 'DOCUMENT_EXPOSURE' },
            //     { text: 'Permission.Email', value: 'PERMISSION_EMAIL' }],
            // filterConditionOptions: [
            //     { text: '', value: '' },
            //     { text: 'Equals', value: 'equal' },
            //     { text: 'Not Equals', value: 'notequal' },
            //     { text: 'Contains', value: 'contain' },
            //     { text: 'Does not contain', value: 'notcontain' }],
            disableEmailField: true,
        })
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

    updatePolicyAction = () => {
        let policyAction = {
            'action_type': 'SEND_EMAIL',
            'config': {
                'to': this.state.To
            }
        }
        this.props.setPolicyFilter('policyActions', policyAction)
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

    render() {
        let containerStyle = {
            height: "100%",
            textAlign: "left"
        };

        let emailFieldInput = (
            <Form.Group widths='equal'>
                <Form.Field control={Input} label='To' placeholder='Enter email...' value={this.state.To} onChange={(event) => this.handleInputEmailChange(event,'To')} onBlur={this.updatePolicyAction} />
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
            return (
                <Container style={containerStyle}>
                    <Form>
                        <Segment.Group>
                            <Segment>
                                <Form.Group widths='equal'>
                                    <Form.Field control={Input} label='Policy Name' placeholder='Specify a value' value={this.state.name} onChange={(event,data) => this.handlePolicyNameChange(event,data,'name')} />
                                    <Form.Field control={Input} label='Policy Description' placeholder='Specify a value' value={this.state.description} onChange={(event,data) => this.handlePolicyNameChange(event,data,'description')} />
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
        }

    }
}

export default connect(mapStateToProps, mapDispatchToProps)(PolicyItemDetail);