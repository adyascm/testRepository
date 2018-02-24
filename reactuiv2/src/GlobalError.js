import React, {Component} from 'react';
import {Message} from 'semantic-ui-react';


class GlobalError extends Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <Message negative fluid size='mini' style={{marginTop: '-20px'}}>
                Error Message
            </Message>
        )
    }
}

export default GlobalError;