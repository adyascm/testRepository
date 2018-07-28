import React, { Component } from 'react';
import { Container, Dimmer, Loader, Grid, Checkbox, Button, Modal, Header, Icon, Segment} from 'semantic-ui-react'

class UserCheckActions extends Component {
    constructor(props) {
        super(props)
    }

    componentWillMount() {
    }

    render() {
        let exportButtonStyle = {
            'float': 'left',
            'width': '80px'
        }

        return (
            <Segment>
                <Button.Group>
                    <Button style={exportButtonStyle} size='mini' onClick={this.onExportClick} > Export </Button>
                    <Button icon>
                        <Icon name='align center' />
                    </Button>
                    <Button icon>
                        <Icon name='align right' />
                    </Button>
                </Button.Group>
            </Segment>
        )
    }
}

export default UserCheckActions;