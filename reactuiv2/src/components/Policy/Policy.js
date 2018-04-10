import React, { Component } from 'react';
import { Card, Button, Modal, Icon, Container, Dimmer, Loader } from 'semantic-ui-react'
import PolicyItemDetail from './PolicyItemDetail';
import { connect } from 'react-redux'
import  agent from '../../utils/agent'
import {
    POLICY_LOAD_START,
    POLICY_LOADED
} from '../../constants/actionTypes'

const mapStateToProps = state => ({
    ...state.policy,
    datasources: state.common.datasources,
    currentUser: state.common.currentUser
})

const mapDispatchToProps = dispatch => ({
    policyLoadStart: () =>
        dispatch({ type: POLICY_LOAD_START }),
    policyLoaded: (payload) =>
        dispatch({ type: POLICY_LOADED, payload })
})

class Policy extends Component {    
    constructor(props) {
        super(props);

        this.state = {
            showPolicyForm: false,
            fetchPolicy: false
        }
    }

    componentWillMount() {
        this.props.policyLoadStart()
        this.props.policyLoaded(agent.Policy.getPolicy())
    }

    componentWillReceiveProps(nextProps) {
        if (this.state.fetchPolicy) {
            nextProps.policyLoadStart()
            nextProps.policyLoaded(agent.Policy.getPolicy())
            this.setState({
                fetchPolicy: false
            })
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
            showPolicyForm: false,
            policyDetails: undefined
        })
    }

    submitPolicyModalForm = () => {
        let policyInfo = {
            "datasource_id": this.props.datasources[0]["datasource_id"],
            "name": this.props.name,
            "description": this.props.description,
            "created_by": this.props.currentUser["email"],
            "trigger_type": this.props.policyType,
            "conditions": this.props.policyConditions,
            "actions": this.props.policyActions
        }

        this.props.policyLoadStart()
        if (!this.state.policyId)
            this.props.policyLoaded(agent.Policy.createPolicy(policyInfo))
        else 
            this.props.policyLoaded(agent.Policy.updatePolicy(this.state.policyId,policyInfo))
        
        this.setState({
            showPolicyForm: false,
            fetchPolicy: true,
            policyDetails: undefined,
            policyId: undefined
        })        
    }

    deletePolicy = (policyId) => {
        this.props.policyLoadStart()
        this.props.policyLoaded(agent.Policy.deletePolicy(policyId))
        this.setState({
            fetchPolicy: true            
        })
    }

    modifyPolicy = (policy) => {
        console.log("modify policy: ", policy)
        this.setState({
            showPolicyForm: true,
            policyDetails: policy,
            policyId: policy.policy_id
        })
    }

    render() {

        let policyCards = null

        if (this.props.policyData && this.props.policyData.length > 0)
            policyCards = this.props.policyData.map(policy => {
                return (
                    <Card>
                        <Card.Content>
                            <Card.Header>
                                {policy.name}
                            </Card.Header>
                            <Card.Description>
                                {policy.description}    
                            </Card.Description>
                        </Card.Content>
                        <Card.Content extra>
                            <div className='ui three buttons'>
                                <Button basic color='red' onClick={() => this.deletePolicy(policy.policy_id)}>Delete</Button>
                                <Button basic color='blue' onClick={() => this.modifyPolicy(policy)}>Modify</Button>    
                            </div>
                        </Card.Content>
                    </Card>
                )
            })

        if (this.state.showPolicyForm) {
            return (
                <Modal size='large' className="scrolling" open={this.state.showPolicyForm}>
                    <Modal.Header>
                        Policy Form
                    </Modal.Header>
                    <Modal.Content>
                        <PolicyItemDetail policyDetails={this.state.policyDetails} />
                    </Modal.Content>
                    <Modal.Actions>
                        <Button negative onClick={this.closePolicyModalForm}>Close</Button>
                        <Button positive onClick={this.submitPolicyModalForm}>Submit</Button>
                    </Modal.Actions>
                </Modal>
            ) 
        }

        else if (this.props.isLoading) {
            return (
                <Container>
                  <Dimmer active inverted>
                    <Loader inverted content='Loading' />
                  </Dimmer>
                </Container >
            )
        }

        return (
            <Card.Group>
                {policyCards}
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

