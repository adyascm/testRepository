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
            filterRow: [],
            name: '',
            description: ''
        }
    }

    componentWillMount() {
        let filterRow = this.state.filterRow
        let newFilter = (<PolicyCondition />)
        filterRow.push(newFilter)

        this.setState({
            policyOptions: [
                { text: '', value: '' },
                { text: 'Permission Change', value: 'PERMISSION_CHANGE' }],
            filterTypeOptions: [
                { text: '', value: '' },
                { text: 'Document.Name', value: 'DOCUMENT_NAME' },
                { text: 'Document.Owner', value: 'DOCUMENT_OWNER' },
                { text: 'Document.Exposure', value: 'DOCUMENT_EXPOSURE' },
                { text: 'Permission.Email', value: 'PERMISSION_EMAIL' }],
            filterConditionOptions: [
                { text: '', value: '' },
                { text: 'Equals', value: 'equal' },
                { text: 'Not Equals', value: 'notequal' },
                { text: 'Contains', value: 'contain' },
                { text: 'Does not contain', value: 'notcontain' }],
            filterRow: this.props.policyFilters?this.props.policyFilters:[],
            disableEmailField: true,
            filterValue: '',
            filterRow: filterRow
        })

        if (this.props.policyDetails) {
            //bulk update the policy filters to state
            //console.log("actions : ", JSON.parse(this.props.policyDetails.actions[0].config).to)
            this.props.updatePolicyFilter(this.props.policyDetails)
            let policyCondition = this.props.policyDetails.conditions.map(policyCondition => {
                return (
                    <PolicyCondition policyCondition={policyCondition} />
                )
            })
            this.setState({
                name: this.props.policyDetails.name,
                description: this.props.policyDetails.description,
                policyTrigger: this.props.policyDetails.trigger_type,
                filterRow: policyCondition,
                disableEmailField: false,
                To: JSON.parse(this.props.policyDetails.actions[0].config).to
            })
        }
        else {
            //Clear the previous state of policy filters
            this.props.updatePolicyFilter(undefined)
        }
    }

    addFilter = () => {
        let key = this.state.filterRow.length
        let newFilter = (
            <PolicyCondition />
        )
        let filterRow = this.state.filterRow
        filterRow.push(newFilter)
        this.setState({ filterRow })
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

    handlePolicyChange = (event,data) => {
        this.props.setPolicyFilter('policyType', data.value)
    }

    handlePolicyDataChange = (event,data,type) => {
        if (type === 'name')
            this.setState({
                'name': data.value
            })
        else 
            this.setState({
                'description': data.value
            })
    }

    updatePolicyData = (event,data,type) => {
        this.props.setPolicyFilter(type,data)
    }

    render() {
        let containerStyle = {
            height: "100%",
            textAlign: "left"
        };

        let filterRow = this.state.filterRow.map((row) => {
            return row
        })

        let emailFieldInput = (
            <Form.Group widths='equal'>
                <Form.Field control={Input} label='To' placeholder='Enter email...' value={this.state.To} onChange={(event) => this.handleInputEmailChange(event,'To')} onBlur={this.updatePolicyAction} />
                {/* <Form.Field control={Input} label='CC' placeholder='Enter email...' onChange={(event) => this.props.sendEmail(event,'CC')} /> */}
            </Form.Group>
        )

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
                            {/* <Segment>
                                <Form.Group>
                                    <Form.Field control={Input} label='Policy Name' placeholder='Specify a value' />
                                    <Form.Field control={Input} label='Policy Description' placeholder='Specify a value' />
                                </Form.Group>
                            </Segment> */}
                            <Segment>
                                <Form.Group widths='equal'>
                                    <Form.Field control={Input} label='Policy Name' placeholder='Specify a value' value={this.state.name} onChange={(event,data) => this.handlePolicyDataChange(event,data,'name')} onBlur={(event,data) => this.updatePolicyData(event,this.state.name,'name')} />
                                    <Form.Field control={Input} label='Policy Description' placeholder='Specify a value' value={this.state.description} onChange={(event,data) => this.handlePolicyDataChange(event,data,'description')} onBlur={(event,data) => this.updatePolicyData(event,this.state.description,'description')} />
                                </Form.Group>
                                <Header as='h4' color='green'>WHEN</Header>
                                <Form.Field control={Select} label='Action' options={this.state.policyOptions} placeholder='Select an action...' value={this.state.policyTrigger} onChange={this.handlePolicyChange} />
                            </Segment>
                            <Segment>
                                <Header as='h4' color='yellow'>IF</Header>
                                {/* <PolicyCondition /> */}
                                {filterRow}
                                <div style={{'textAlign': 'center'}}>
                                    <Button basic color='green' onClick={this.addFilter}>Add Filter</Button>
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