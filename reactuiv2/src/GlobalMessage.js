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

        if (this.props.errorMessage && this.props.errorMessage.length > 0)
            return (
                <Container>
                    <Message negative fluid={true} size='mini' style={{marginTop: '-25px'}} onDismiss={this.handleDismiss}>
                        {this.props.errorMessage}
                    </Message>
                </Container>
            )
        if (this.props.infoMessage && this.props.infoMessage.length > 0)
            return (
                <Container>
                    <Message warning fluid={true} size='mini' style={{marginTop: '-25px'}} onDismiss={this.handleDismiss}>
                        {this.props.infoMessage}
                    </Message>
                </Container>
            )
        else 
            return null
    }
}

export default connect(mapStateToProps,mapDispatchToProps)(GlobalMessage);