import React, { Component } from "react";
import { Link, Redirect } from 'react-router-dom'
import ListErrors from './ListErrors'
import { connect } from 'react-redux';
import agent from '../utils/agent';
import authenticate from '../utils/oauth';
import { Segment, Header, Button, Grid, Image, Message } from 'semantic-ui-react';
import {
    UPDATE_FIELD_AUTH,
    LOGIN, LOGIN_ERROR, LOGIN_SUCCESS, GET_ALL_ACTIONS,
    LOGIN_PAGE_UNLOADED,
    LOGIN_START,
    API_ROOT
} from '../constants/actionTypes';

const mapStateToProps = state => ({
    ...state.auth,
    ...state.all_actions_list,
    token: state.common.token,
    currentUser: state.common.currentUser,
    errorMessage: state.common.errMessage
});

const mapDispatchToProps = dispatch => ({
    onSignInError: (errors) =>
        dispatch({ type: LOGIN_ERROR, error: errors }),
    onSignInComplete: (data) =>
        dispatch({ type: LOGIN_SUCCESS, ...data }),
    onLoginStart: () =>
        dispatch({ type: LOGIN_START }),
    onUnload: () =>
        dispatch({ type: LOGIN_PAGE_UNLOADED })
});

class Login extends Component {
    constructor() {
        super();
        this.signInGoogle = () => ev => {
            ev.preventDefault();
            this.props.onLoginStart()
            authenticate("login_scope").then(data => {
                this.props.onSignInComplete(data)
            }).catch(({ errors }) => {
                console.log("login error : ", errors['Failed'])
                this.props.onSignInError(errors)
            });
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
                                    <Button content='SignIn with Google' color='google plus' icon='google' onClick={this.signInGoogle()} loading={this.props.inProgress?true:false} disabled={this.props.inProgress||this.props.errorMessage?true:false} />
                                    <Button.Or />
                                    <Button content='SignIn with Microsoft' color='twitter' disabled icon='windows' onClick={this.signInGoogle()} />
                                </Button.Group>
                                {/* <p style={{color: 'red'}}>{this.props.errors?this.props.errors['Failed']:''}</p> */}
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
