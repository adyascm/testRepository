import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Button, Modal } from 'semantic-ui-react';



class DeleteApp extends Component {
    constructor(props){
        super(props);
        this.state = {
            showDeleteForm:false,
        }
    }

    componentWillMount(){
        window.scrollTo(0, 0)
    }

    render(){
        console.log('render delete app');
        return(
            <Modal size='large' dimmer="inverted" className="scrolling" open={this.props.showDeleteForm}>
                <Modal.Header style={{ border:'0'}}>
                    Do you want to permanently delete this app?
                </Modal.Header>
                <Modal.Content>
                    <Modal.Actions style={{ "textAlign": 'right' }}>
                        <Button negative onClick={ () => {this.props.handleDeleteForm('YES')}}>Yes</Button>
                        <Button positive onClick={ () => {this.props.handleDeleteForm('NO')}}>NO</Button>
                    </Modal.Actions> 
                </Modal.Content>
            </Modal>
        )
    }
}


export default DeleteApp;