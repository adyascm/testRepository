import React, { Component } from 'react';
import { connect } from 'react-redux';

import { Loader, Dimmer, Container, Segment, Form, Select, Header, Input, Checkbox, Button, Label, Icon } from 'semantic-ui-react';

import agent from '../../utils/agent';

import {
    SET_POLICY_ROW_FILTERS,
    SET_POLICY_FILTER,
    CREATE_POLICY_LOAD_START,
    CREATE_POLICY_LOADED
} from '../../constants/actionTypes';


const mapStateToProps = state => ({
    ...state.policy
});

const mapDispatchToProps = dispatch => ({
    setPolicyRowFilters: (payload) => 
        dispatch({ type: SET_POLICY_ROW_FILTERS, payload }),
    setPolicyFilter: (policyFilterType, policyFilterValue) => 
        dispatch({ type: SET_POLICY_FILTER, policyFilterType, policyFilterValue }),
    policyLoadStart: () =>
        dispatch({ type: CREATE_POLICY_LOAD_START }),
    createPolicy: (payload) =>
        dispatch({ type: CREATE_POLICY_LOADED, payload })
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
            actionOptions: [
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

    // componentWillUnmount() {
    //     console.log("state filter : ", this.state.filterRow)
    //     this.props.setPolicyRowFilters(this.state.filterRow)
    // }

    addFilter = () => {
        let key = this.state.filterRow.length
        let newFilter = (
            <Form.Group key={key} widths='equal'>
                <Form.Field control={Select} label='Type' options={this.state.filterTypeOptions} placeholder='Select a filter...' onChange={this.handleFilterTypeChange} />
                <Form.Field control={Select} label='Condition' options={this.state.filterConditionOptions} placeholder='Select a condition...' onChange={this.handleFilterConditionChange} />
                <Form.Field control={Input} label='Value' placeholder='Specify a value' onChange={this.handleFilterValueChange} onKeyPress={this.handleKeyPress} />
                <div style={{'height': '20px', 'paddingTop': '25px'}}>
                    <Button basic color='red' onClick={this.removeFilter}>
                        <Icon name='close' />
                    </Button>
                </div>
            </Form.Group>
        )
        let filterRow = this.state.filterRow
        filterRow.push(newFilter)
        this.props.setPolicyRowFilters(this.state.filterRow)
        this.setState({ filterRow })
    }

    removeFilter = () => {
        let filterRow = this.state.filterRow
        filterRow.pop()
        this.props.setPolicyRowFilters(this.state.filterRow)
        this.setState({ filterRow })
    }

    sendEmailChange = () => {
        this.setState({
            disableEmailField: !this.state.disableEmailField
        })
    }

    handleFilterTypeChange = (event,data) => {
        this.props.setPolicyFilter('filterType', data.value)
    }

    handleFilterConditionChange = (event,data) => {
        this.props.setPolicyFilter('filterCondition', data.value)
    }

    handleFilterValueChange = (event,data) => {
        this.setState({
            filterValue: data.value
        })
    }

    handleKeyPress = (event) => {
        if (event.key === 'Enter')
            this.props.setPolicyFilter('filterValue', this.state.filterValue)
    }

    handleActionChange = (event,data) => {
        this.props.setPolicyFilter('actionType', data.value)
    }

    // handleSubmit = () => {
    //     let policyInfo = {
    //         "match_type": this.props.filterType,
    //         "match_condition": this.props.filterCondition,
    //         "match_value": this.props.filterValue,
    //         "trigger_type": this.props.actionType
    //     }
    //     this.props.policyLoadStart()
    //     this.props.createPolicy(agent.Policy.createPolicy(policyInfo))
    // }

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
                <Form.Field control={Input} label='To' placeholder='Enter email...' />
                <Form.Field control={Input} label='CC' placeholder='Enter email...' />
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
                                <Form.Field control={Select} label='Action' options={this.state.actionOptions} placeholder='Select an action...' onChange={this.handleActionChange} />
                            </Segment>
                            <Segment>
                                <Header as='h4' color='yellow'>IF</Header>
                                <Form.Group key={this.state.filterRow.length} widths='equal'>
                                    <Form.Field control={Select} label='Type' options={this.state.filterTypeOptions} placeholder='Select a filter...' onChange={this.handleFilterTypeChange} />
                                    <Form.Field control={Select} label='Condition' options={this.state.filterConditionOptions} placeholder='Select a condition...' onChange={this.handleFilterConditionChange} />
                                    <Form.Field control={Input} label='Value' placeholder='Specify a value' value={this.state.filterValue} onChange={this.handleFilterValueChange} onKeyPress={this.handleKeyPress} />
                                    <div style={{'height': '20px', 'paddingTop': '25px', 'visibility': 'hidden'}}>
                                        <Button basic color='red'>
                                            <Icon name='close' />
                                        </Button>
                                    </div>
                                </Form.Group>
                                {filterRow}
                                <div style={{'textAlign': 'center'}}>
                                    <Button basic color='green' onClick={this.addFilter}>Add Filter</Button>
                                </div>
                            </Segment>
                            <Segment>
                                <Header as='h4' color='red'>THEN</Header>
                                <Form.Field control={Checkbox} label='Send Email' onChange={this.sendEmailChange} />
                                {this.state.disableEmailField?null:emailFieldInput}
                                <div style={{'textAlign': 'right'}}>
                                    <Button basic color='red'>Cancel</Button>
                                    <Button basic color='green' onClick={this.handleSubmit}>Submit</Button>
                                </div>
                            </Segment>
                        </Segment.Group>
                    </Form>
                </Container>
            )
        }

    }
}

export default connect(mapStateToProps, mapDispatchToProps)(PolicyItemDetail);