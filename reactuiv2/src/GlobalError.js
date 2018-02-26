import React, {Component} from 'react';
import {connect} from 'react-redux';

import {Message,Container} from 'semantic-ui-react';

import {CLEAR_ERROR} from './constants/actionTypes';

const mapStateToProps = state => ({
    ...state.error
})

const mapDispatchToProps = dispatch => ({
    clearError: () => dispatch({ type: CLEAR_ERROR })
})

class GlobalError extends Component {
    constructor(props) {
        super(props);

        this.handleDismiss = this.handleDismiss.bind(this);
    }

    handleDismiss() {
        this.props.clearError()
    }

    render() {

        if (this.props.errMessage)
            return (
                <Container>
                    <Message negative fluid size='mini' style={{marginTop: '-25px'}} onDismiss={this.handleDismiss}>
                        {this.props.errMessage}
                    </Message>
                </Container>
            )
        else 
            return null
    }
}

export default connect(mapStateToProps,mapDispatchToProps)(GlobalError);