import React, { Component } from "react";
import { Redirect } from 'react-router-dom'
import { connect } from 'react-redux';
import authenticate from '../utils/oauth';
import { Segment, Header, Button, Grid, Image } from 'semantic-ui-react';
import {
    LOGIN_ERROR, 
    LOGIN_SUCCESS,
    LOGIN_PAGE_UNLOADED,
    LOGIN_START
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
                            {/*<Segment >
                                 <Button.Group> */}
                                    <Button basic onClick={this.signInGoogle()} loading={this.props.inProgress?true:false} disabled={this.props.inProgress||this.props.errorMessage?true:false} >
                                        <Button.Content>
                                            <Image src='/images/btn_google_signin_light_normal_web.png' />
                                        </Button.Content>
                                    </Button>
                                    {/* <Button.Or />
                                    <Button content='SignIn with Microsoft' color='twitter' disabled icon='windows' onClick={this.signInGoogle()} />
                                </Button.Group> 
                            </Segment>*/}
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
