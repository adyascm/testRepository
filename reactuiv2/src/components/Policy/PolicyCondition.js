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
                { text: '', value: '' },
                { text: 'Document.Name', value: 'DOCUMENT_NAME' },
                { text: 'Document.Owner', value: 'DOCUMENT_OWNER' },
                { text: 'Document.Exposure', value: 'DOCUMENT_EXPOSURE' },
                { text: 'Permission.Email', value: 'PERMISSION_EMAIL' }
            ],
            filterConditionOptions: [
                { text: '', value: '' },
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
                filterType: this.props.policyCondition.match_type,
                filterCondition: this.props.policyCondition.match_condition,
                filterValue: this.props.policyCondition.match_value
            })
        }
    }

    handleFilterTypeChange = (event,data) => {
        this.setState({
            filterType: data.value
        })
    }

    handleFilterConditionChange = (event,data) => {
        this.setState({
            filterCondition: data.value
        })
    }

    handleFilterValueChange = (event,data) => {
        this.setState({
            filterValue: data.value
        })
    }

    // handleKeyPress = (event) => {
    //     if (event.key === 'Enter') {
    //         let appliedFilter = {
    //             "match_type": this.state.filterType,
    //             "match_condition": this.state.filterCondition,
    //             "match_value": this.state.filterValue
    //         }
    //         this.props.setPolicyFilter('policyConditions', appliedFilter)
    //     }
    // }

    updateFilterValueChange = () => {
        let appliedFilter = {
            "match_type": this.state.filterType,
            "match_condition": this.state.filterCondition,
            "match_value": this.state.filterValue
        }
        this.props.setPolicyFilter('policyConditions', appliedFilter)
    }

    // removeFilter = () => {
    //     let filterRow = this.state.filterRow
    //     filterRow.pop()
    //     this.props.setPolicyRowFilters(this.state.filterRow)
    //     this.setState({ filterRow })
    // }

    render() {
        return (
            <Form.Group widths='equal'>
                <Form.Field control={Select} label='Type' options={this.state.filterTypeOptions} value={this.state.filterType} placeholder='Select a filter...' onChange={this.handleFilterTypeChange} />
                <Form.Field control={Select} label='Condition' options={this.state.filterConditionOptions} value={this.state.filterCondition} placeholder='Select a condition...' onChange={this.handleFilterConditionChange} />
                <Form.Field control={Input} label='Value' placeholder='Specify a value' value={this.state.filterValue} onChange={this.handleFilterValueChange} onBlur={this.updateFilterValueChange} />
                {/* <div style={{'height': '20px', 'paddingTop': '25px'}}>
                    <Button basic color='red' onClick={this.removeFilter}>
                        <Icon name='close' />
                    </Button>
                </div> */}
            </Form.Group>
        )
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(PolicyCondition);