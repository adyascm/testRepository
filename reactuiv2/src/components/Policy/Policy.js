import React, { Component } from 'react';
import { Card, Button, Modal, Icon } from 'semantic-ui-react'
import PolicyItemDetail from './PolicyItemDetail';
import { connect } from 'react-redux'
import  agent from '../../utils/agent'
import {
    CREATE_POLICY_LOAD_START,
    CREATE_POLICY_LOADED
} from '../../constants/actionTypes'

const mapStateToProps = state => ({
    ...state.policy,
    datasources: state.common.datasources,
    currentUser: state.common.currentUser
})

const mapDispatchToProps = dispatch => ({
    policyLoadStart: () =>
        dispatch({ type: CREATE_POLICY_LOAD_START }),
    createPolicy: (payload) =>
        dispatch({ type: CREATE_POLICY_LOADED, payload })
})

class Policy extends Component {    
    constructor(props) {
        super(props);

        this.state = {
            showPolicyForm: false
        }
    }

    openPolicyModalForm = () => {
        this.setState({
            showPolicyForm: true
        })
    }

    closePolicyModalForm = (event) => {
        event.preventDefault()
        this.setState({
            showPolicyForm: false
        })
    }

    submitPolicyModalForm = () => {
        let policyInfo = {
            "datasource_id": this.props.datasources[0]["datasource_id"],
            "name": "TestPolicy",
            "description": "Test",
            "created_by": this.props.currentUser["email"],
            "trigger_type": this.props.policyType,
            "conditions": this.props.policyConditions,
            "actions": [{
                "action_type": this.props.actionType,
                "config": {
                    "to": this.state.To
                }
            }]
        }
        this.props.policyLoadStart()
        this.props.createPolicy(agent.Policy.createPolicy(policyInfo))
    }

    handleInputEmailChange = (event, emailCategory) => {
        if (emailCategory === 'To')
            this.setState({
                'To': event.target.value
            })
        else 
            this.setState({
                'CC': event.target.value
            })
    }

    render() {
        if (this.state.showPolicyForm) {
            return (
                <Modal size='large' className="scrolling" open={this.state.showPolicyForm}>
                    <Modal.Header>
                        Policy Form
                    </Modal.Header>
                    <Modal.Content>
                        <PolicyItemDetail sendEmail={this.handleInputEmailChange} />
                    </Modal.Content>
                    <Modal.Actions>
                        <Button negative onClick={this.closePolicyModalForm}>Close</Button>
                        <Button positive onClick={this.submitPolicyModalForm}>Submit</Button>
                    </Modal.Actions>
                </Modal>
            ) 
        }

        return (
            <Card.Group>
                <Card>
                  <Card.Content>
                    <Card.Description>
                      Click on Add Policy to add a new Policy
                    </Card.Description>
                  </Card.Content>
                  <Card.Content extra>
                    <Button basic color='green'onClick={this.openPolicyModalForm}>Add Policy</Button>
                  </Card.Content>
                </Card>
            </Card.Group>
          )
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(Policy);

