import React, { Component } from 'react';
import { connect } from 'react-redux';

import { Loader, Dimmer, Container, Segment, Form, Select, Header, Input, Checkbox } from 'semantic-ui-react';

import agent from '../../utils/agent';
import DateComponent from '../DateComponent'

import {
    AUDIT_LOG_LOAD_START,
    AUDIT_LOG_LOADED
} from '../../constants/actionTypes';


const mapStateToProps = state => ({
});

const mapDispatchToProps = dispatch => ({
});

class PolicyItemDetail extends Component {
    componentWillMount() {
        this.setState({
            actionOptions: [
                { text: '', value: '' },
                { text: 'Permission Change', value: 'perm_change' }],
            filterOptions: [
                { text: '', value: '' },
                { text: 'Document.Name', value: 'perm_change' },
                { text: 'Document.Owner', value: 'perm_change' },
                { text: 'Document.Exposure', value: 'perm_change' },
                { text: 'Permission.Email', value: 'perm_change' }],
            filterConditionOptions: [
                { text: '', value: '' },
                { text: 'Equals', value: 'perm_change' },
                { text: 'Not Equals', value: 'perm_change' },
                { text: 'Contains', value: 'perm_change' },
                { text: 'Does not contain', value: 'perm_change' }]
        })
    }

    render() {
        let containerStyle = {
            height: "100%",
            textAlign: "left"
        };

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
                                <Form.Group widths='equal'>
                                    <Form.Field control={Select} label='Type' options={this.state.filterOptions} placeholder='Select a filter...' />
                                    <Form.Field control={Select} label='Condition' options={this.state.filterConditionOptions} placeholder='Select a condition...' />
                                    <Form.Field control={Input} label='Value' placeholder='Specify a value' />
                                </Form.Group>
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