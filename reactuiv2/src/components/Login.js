import React, { Component } from "react";
import { Link, Redirect } from 'react-router-dom'
import ListErrors from './ListErrors'
import { connect } from 'react-redux';
import agent from '../utils/agent';
import authenticate from '../utils/oauth';
import { Segment, Header, Button, Grid, Image, Message } from 'semantic-ui-react';
import {
    UPDATE_FIELD_AUTH,
    LOGIN, LOGIN_ERROR, LOGIN_SUCCESS,
    LOGIN_PAGE_UNLOADED,
    API_ROOT
} from '../constants/actionTypes';

const mapStateToProps = state => ({
    ...state.auth,
    token: state.common.token,
    currentUser: state.common.currentUser
});

const mapDispatchToProps = dispatch => ({
    onSignInError: (errors) =>
        dispatch({ type: LOGIN_ERROR, error: errors }),
    onSignInComplete: (data) =>
        dispatch({ type: LOGIN_SUCCESS, ...data }),
    onUnload: () =>
        dispatch({ type: LOGIN_PAGE_UNLOADED })
});

class Login extends Component {
    constructor() {
        super();
        this.signInGoogle = () => ev => {
            ev.preventDefault();
            authenticate("login_scope").then(data => this.props.onSignInComplete(data)).catch(({ errors }) => { this.props.onSignInError(errors) });
        };
    }
    componentWillUnmount() {
        this.props.onUnload();
    }
    render() {
        if (!this.props.currentUser) {
            return (
                <div style={{ height: '100%' }}>
                    <Grid textAlign='center'
                        style={{ height: '100%' }}
                        verticalAlign='middle' >
                        <Grid.Column style={{ maxWidth: 450 }}>
                            <Image size='massive' src='/images/AdyaLogo.png' />
                            <Header as='h3' color='teal' textAlign='center'>
                                Manage and secure your SaaS Apps
                            </Header>
                            <Segment >
                                <Button.Group>
                                    <Button content='SignIn with Google' color='google plus' icon='google' onClick={this.signInGoogle()} />
                                    <Button.Or />
                                    <Button content='SignIn with Microsoft' color='twitter' disabled icon='windows' onClick={this.signInGoogle()} />
                                </Button.Group>
                            </Segment>

                        </Grid.Column>
                    </Grid>
                </div>
            );
        } else {
            return (
                <Redirect to="/" />
            )
        }
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(Login);