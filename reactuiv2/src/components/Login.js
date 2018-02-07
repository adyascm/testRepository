import React, { Component } from "react";
import { Link, Redirect } from 'react-router-dom'
import ListErrors from './ListErrors'
import { connect } from 'react-redux';
import agent from '../utils/agent';
import authenticate from '../utils/oauth';
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
            authenticate("login_scope").then(data => this.props.onSignInComplete(data)).catch(({errors}) => {this.props.onSignInError(errors)});
        };
    }
    componentWillUnmount() {
        this.props.onUnload();
    }
    render() {
        if (!this.props.currentUser) {
            return (
                <div className="auth-page">
                    <div className="container page">
                        <div className="row">

                            <div className="col-md-6 offset-md-3 col-xs-12">

                                <ListErrors errors={this.props.errors} />

                                <button
                                    className="btn btn-lg btn-primary pull-xs-center"
                                    onClick={this.signInGoogle()}
                                    disabled={this.props.inProgress || this.props.errors}>
                                    Sign in with Google
                                </button>
                            </div>

                        </div>
                    </div>
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