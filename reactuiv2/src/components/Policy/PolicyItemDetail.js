import React, { Component } from 'react';
import { connect } from 'react-redux';

import { Loader, Dimmer, Container, Segment, Form, Select, Header, Input, Checkbox, Button, Label, Icon } from 'semantic-ui-react';

import agent from '../../utils/agent';
import DateComponent from '../DateComponent'

import {
    SET_POLICY_ROW_FILTERS
} from '../../constants/actionTypes';


const mapStateToProps = state => ({
    ...state.policy
});

const mapDispatchToProps = dispatch => ({
    setPolicyRowFilters: (payload) => 
        dispatch({ type: SET_POLICY_ROW_FILTERS, payload })
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
                { text: 'Permission Change', value: 'perm_change1' }],
            filterOptions: [
                { text: '', value: '' },
                { text: 'Document.Name', value: 'perm_change1' },
                { text: 'Document.Owner', value: 'perm_change2' },
                { text: 'Document.Exposure', value: 'perm_change3' },
                { text: 'Permission.Email', value: 'perm_change4' }],
            filterConditionOptions: [
                { text: '', value: '' },
                { text: 'Equals', value: 'perm_change1' },
                { text: 'Not Equals', value: 'perm_change2' },
                { text: 'Contains', value: 'perm_change3' },
                { text: 'Does not contain', value: 'perm_change4' }],
            filterRow: this.props.policyFilters?this.props.policyFilters:[]
        })
    }

    // componentWillUnmount() {
    //     console.log("state filter : ", this.state.filterRow)
    //     this.props.setPolicyRowFilters(this.state.filterRow)
    // }

    AddFilter = () => {
        let key = this.state.filterRow.length
        let newFilter = (
            <Form.Group key={key} widths='equal'>
                <Form.Field control={Select} label='Type' options={this.state.filterOptions} placeholder='Select a filter...' />
                <Form.Field control={Select} label='Condition' options={this.state.filterConditionOptions} placeholder='Select a condition...' />
                <Form.Field control={Input} label='Value' placeholder='Specify a value' />
                <div style={{'height': '20px', 'paddingTop': '25px'}}>
                    <Button basic color='red' onClick={this.RemoveFilter}>
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

    RemoveFilter = () => {
        let filterRow = this.state.filterRow
        filterRow.pop()
        this.props.setPolicyRowFilters(this.state.filterRow)
        this.setState({ filterRow })
    }

    render() {
        let containerStyle = {
            height: "100%",
            textAlign: "left"
        };

        let filterRow = this.state.filterRow.map((row) => {
            return row
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
                                <Header as='h4' color='green'>WHEN</Header>
                                <Form.Field control={Select} label='Action' options={this.state.actionOptions} placeholder='Select an action...' />
                            </Segment>
                            <Segment>
                                <Header as='h4' color='yellow'>IF</Header>
                                <Form.Group key={this.state.filterRow.length} widths='equal'>
                                    <Form.Field control={Select} label='Type' options={this.state.filterOptions} placeholder='Select a filter...' />
                                    <Form.Field control={Select} label='Condition' options={this.state.filterConditionOptions} placeholder='Select a condition...' />
                                    <Form.Field control={Input} label='Value' placeholder='Specify a value' />
                                    {/* <div style={{'height': '20px', 'paddingTop': '25px'}}>
                                        <Button basic color='red' onClick={this.RemoveFilter}>
                                            <Icon name='close' />
                                        </Button>
                                    </div> */}
                                </Form.Group>
                                {filterRow}
                                <div style={{'textAlign': 'center'}}>
                                    <Button basic color='green' onClick={this.AddFilter}>Add Filter</Button>
                                </div>
                            </Segment>
                            <Segment>
                                <Header as='h4' color='red'>THEN</Header>
                                <Form.Field control={Checkbox} label='Send Email' />
                            </Segment>
                        </Segment.Group>
                    </Form>
                </Container>
            )
        }

    }
}

export default connect(mapStateToProps, mapDispatchToProps)(PolicyItemDetail);