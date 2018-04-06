import React, { Component } from 'react';
import { connect } from 'react-redux';
import PolicyCondition from './PolicyCondition'
import { Loader, Dimmer, Container, Segment, Form, Select, Header, Input, Checkbox, Button, Label, Icon } from 'semantic-ui-react';

import agent from '../../utils/agent';

import {
    SET_POLICY_FILTER,
    CREATE_POLICY_LOAD_START,
    CREATE_POLICY_LOADED
} from '../../constants/actionTypes';


const mapStateToProps = state => ({
    ...state.policy
});

const mapDispatchToProps = dispatch => ({
    setPolicyFilter: (policyFilterType, policyFilterValue) => 
        dispatch({ type: SET_POLICY_FILTER, policyFilterType, policyFilterValue })
});

class PolicyItemDetail extends Component {
    constructor(props) {
        super(props);

        this.state = {
            filterRow: []
        }
    }

    componentWillMount() {
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
            filterValue: ''
        })
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
        if (this.state.disableEmailField) 
            this.props.setPolicyFilter('actionType', 'SEND_EMAIL')
        this.setState({
            disableEmailField: !this.state.disableEmailField
        })
    }

    // handleInputEmailChange = (event, emailCategory) => {
    //     this.setState({
    //         emailCategory: event.target.value
    //     })
    // }

    handlePolicyChange = (event,data) => {
        this.props.setPolicyFilter('policyType', data.value)
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
                <Form.Field control={Input} label='To' placeholder='Enter email...' onChange={(event) => this.props.sendEmail(event,'To')} />
                <Form.Field control={Input} label='CC' placeholder='Enter email...' onChange={(event) => this.props.sendEmail(event,'CC')} />
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
                            <Segment>
                                <Header as='h4' color='green'>WHEN</Header>
                                <Form.Field control={Select} label='Action' options={this.state.policyOptions} placeholder='Select an action...' onChange={this.handlePolicyChange} />
                            </Segment>
                            <Segment>
                                <Header as='h4' color='yellow'>IF</Header>
                                <PolicyCondition />
                                {filterRow}
                                <div style={{'textAlign': 'center'}}>
                                    <Button basic color='green' onClick={this.addFilter}>Add Filter</Button>
                                </div>
                            </Segment>
                            <Segment>
                                <Header as='h4' color='red'>THEN</Header>
                                <Form.Field control={Checkbox} label='Send Email' onChange={this.sendEmailChange} />
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