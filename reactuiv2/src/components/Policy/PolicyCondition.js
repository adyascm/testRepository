import React, { Component } from 'react'
import { Form, Select, Input, Button, Icon } from 'semantic-ui-react'
import { connect } from 'react-redux'
import {
    SET_POLICY_FILTER
} from '../../constants/actionTypes'

const mapStateToProps = state => ({
    ...state.policy
})

const mapDispatchToProps = dispatch => ({
    setPolicyFilter: (policyFilterType, policyFilterValue) => 
        dispatch({ type: SET_POLICY_FILTER, policyFilterType, policyFilterValue })
})

class PolicyCondition extends Component {
    constructor(props) {
        super(props);

        this.state = {
            filterTypeOptions: [
                { text: 'Document.Name', value: 'DOCUMENT_NAME' },
                { text: 'Document.Owner', value: 'DOCUMENT_OWNER' },
                { text: 'Document.Exposure', value: 'DOCUMENT_EXPOSURE' },
                { text: 'Permission.Email', value: 'PERMISSION_EMAIL' }
            ],
            filterConditionOptions: [
                { text: 'Equals', value: 'equal' },
                { text: 'Not Equals', value: 'notequal' },
                { text: 'Contains', value: 'contain' },
                { text: 'Does not contain', value: 'notcontain' }
            ],
            filterValue: ''
        }
    }

    componentWillMount() {
        if (this.props.policyCondition) {
            this.setState({
                policyCondition: this.props.policyCondition
            })
        }
    }

    componentWillReceiveProps(nextProps){
        if (nextProps.policyCondition) {
            this.setState({
                policyCondition: nextProps.policyCondition
            })
        }
    }

    handleFilterTypeChange = (event,data) => {
        var condition = this.state.policyCondition;
        condition.match_type = data.value;
        this.setState({
            policyCondition: condition
        })
    }

    handleFilterConditionChange = (event,data) => {
        var condition = this.state.policyCondition;
        condition.match_condition = data.value;
        this.setState({
            policyCondition: condition
        })
    }

    handleFilterValueChange = (event,data) => {
        var condition = this.state.policyCondition;
        condition.match_value = data.value;
        this.setState({
            policyCondition: condition
        })
    }

    render() {
        return (
            <Form.Group widths='equal'>
                <Form.Field required control={Select} label='Type' options={this.state.filterTypeOptions} value={this.state.policyCondition.match_type} placeholder='Select a filter...' onChange={this.handleFilterTypeChange} />
                <Form.Field required control={Select} label='Match' options={this.state.filterConditionOptions} value={this.state.policyCondition.match_condition} placeholder='Select a match...' onChange={this.handleFilterConditionChange} />
                <Form.Field required control={Input} label='Value' placeholder='Specify a value' value={this.state.policyCondition.match_value} onChange={this.handleFilterValueChange}  />
                <div style={{'height': '20px', 'paddingTop': '25px'}}>
                    <Button basic color='red' onClick={() => this.props.removeFilter(this.props.index)}>
                        <Icon name='close' />
                    </Button>
                </div>
            </Form.Group>
        )
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(PolicyCondition);