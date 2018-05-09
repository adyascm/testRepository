import React, {Component} from 'react';
import {connect} from 'react-redux';

import {Message,Container} from 'semantic-ui-react';

import {CLEAR_MESSAGE} from './constants/actionTypes';

const mapStateToProps = state => ({
    ...state.message
})

const mapDispatchToProps = dispatch => ({
    clearMessage: () => dispatch({ type: CLEAR_MESSAGE })
})

class GlobalMessage extends Component {
    constructor(props) {
        super(props);

        this.handleDismiss = this.handleDismiss.bind(this);
    }

    handleDismiss() {
        this.props.clearMessage()
    }

    render() {

        if (this.props.errorCount > 0) {
            let errorMessage = this.props.errorMessage.map((message, index) => {
                return (
                    <li key={index} style={{'textAlign': 'left'}}>{message}</li>
                )
            })
            return (
                <Container>
                    <Message negative fluid={true} size='mini' style={{marginTop: '-25px', marginBottom: '20px'}} onDismiss={this.handleDismiss}>
                        {errorMessage}
                    </Message>
                </Container>
            )
        }
        if (this.props.warningCount > 0) {
            let warningMessage = this.props.infoMessage.map((message, index) => {
                return (
                    <li key={index} style={{'textAlign': 'left'}}>{message}</li>
                )
            })
            return (
                <Container>
                    <Message warning fluid={true} size='mini' style={{marginTop: '-25px', marginBottom: '20px'}} onDismiss={this.handleDismiss}>
                        {warningMessage}
                    </Message>
                </Container>
            )
        }
        else 
            return null
    }
}

export default connect(mapStateToProps,mapDispatchToProps)(GlobalMessage);