import React, { Component } from "react";
import { Redirect } from 'react-router-dom'
import { connect } from 'react-redux';
import authenticate from '../utils/oauth';
import { Dimmer, Loader } from 'semantic-ui-react'
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

class NewLogin extends Component {
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
                    <div className="app-adya-wrap ">
                        <div className="clearfix"></div>
                        <section className="below_header">
                        <div className="home_bg">
                        <div className="container">
                        <div className="padd-top">
                            <div className="box-bg text-center bg-grey">
                            <img src="/images/logo.png" width="200px" height="100%"/>
                            <h1 className="orange-color">Manage and secure your SaaS Apps</h1>
                            <div className="text-center scan-button p-b-30" onClick={this.signInGoogle()}>
                                <a className="btn-wrap btn-wrap-header orange-color font-white" target="_blank" style={{"cursor":"pointer"}}><img src="/images/Google.png" /></a>
                                {this.props.inProgress?
                                    <Dimmer active inverted>
                                        <Loader inverted />
                                    </Dimmer>: null
                                }
                            </div>
                            <p><a href="https://www.adya.io/resources/" target="_blank" style={{"color":"#333"}}>Click here for installation instructions</a></p>
                            <p><a href="https://www.adya.io/privacy-policy/" target="_blank" style={{"color":"gray","font-size":"12pt"}}>Privacy Policy</a></p>
                            </div>
                            </div>
                            </div>
                            </div>
                        </section>
                    <div className="clearfix"></div>
                    </div>
            )
        } else {
            return (
                <Redirect to="/" />
            )
        }
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(NewLogin);
