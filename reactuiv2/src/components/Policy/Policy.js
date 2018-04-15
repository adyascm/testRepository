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
    ...state.policy
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
        if ((nextProps.policyData !== this.props.policyData) && (this.state.showPolicyForm ||
            this.state.fetchPolicy)) {
            nextProps.policyLoadStart()
            nextProps.policyLoaded(agent.Policy.getPolicy())
            this.setState({
                showPolicyForm: false,
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
            policyCards = this.props.policyData.map((policy, index) => {
                return (
                    <Card key={index}>
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

        if (this.props.isLoading) {
            return (
                <Container>
                  <Dimmer active inverted>
                    <Loader inverted content='Loading' />
                  </Dimmer>
                </Container >
            )
        }

        return (
            <div>
                <Card.Group>
                    {policyCards}
                    <Card>
                    <Card.Content>
                        <Card.Description>
                        Click on button to add a new policy
                        </Card.Description>
                    </Card.Content>
                    <Card.Content extra>
                        <Button basic color='green' onClick={this.openPolicyModalForm}>Add Policy</Button>
                    </Card.Content>
                    </Card>
                </Card.Group>
                {/* {!this.state.showPolicyForm?null:(<PolicyItemDetail showPolicyForm={this.state.showPolicyForm} policyDetails={this.state.policyDetails} 
                    closePolicyModalForm={this.closePolicyModalForm} submitPolicyModalForm={this.submitPolicyModalForm} />)} */}
                <PolicyItemDetail policyDetails={this.state.policyDetails} showPolicyForm={this.state.showPolicyForm} 
                    closePolicyModalForm={this.closePolicyModalForm} />
            </div>
          )
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(Policy);

