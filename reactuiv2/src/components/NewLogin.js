import React, { Component } from "react";
import { Redirect } from 'react-router-dom'
import { connect } from 'react-redux';
import oauth from '../utils/oauth';
import { Dimmer, Loader } from 'semantic-ui-react'
import {
    LOGIN_ERROR,
    LOGIN_SUCCESS,
    LOGIN_PAGE_UNLOADED,
    LOGIN_START,
    FLAG_ERROR_MESSAGE
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
        dispatch({ type: LOGIN_PAGE_UNLOADED }),
    onBlockedUser: (errorMessage) =>
        dispatch({ type: FLAG_ERROR_MESSAGE, error: errorMessage })
});

class NewLogin extends Component {
    constructor() {
        super();

        this.state = {
            chkbox:false
        }

        this.signInGoogle = () => ev => {
            ev.preventDefault();
            this.props.onLoginStart()
            oauth.authenticateGsuite("login_scope").then(data => {
                this.props.onSignInComplete(data)
            }).catch(({ errors }) => {
                {errors['Failed'] === 'BLOCKED' ? this.props.onBlockedUser("This is a blocked account. please contact your administrator") : null}
                this.props.onSignInError(errors)
            });
        };
        this.enableGoogleSignIn = () => ev => {
            this.setState({
                chkbox : !this.state.chkbox
            })
        }
    }

    componentWillUnmount() {
        this.props.onUnload();

    }

    render() {
        if (!this.props.currentUser) {
            let divStyle = {"display":"inline-flex"}
            let anchorStyle = {"cursor":"pointer"}
            if (!this.state.chkbox){
                divStyle["cursor"] = "not-allowed"
                anchorStyle = {
                    "pointerEvents":"none"
                }
            }

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
                            <div>
                            <input type="checkbox" style={{"marginRight":"10px", "fontSize":"2em"}} defaultChecked={this.state.chkbox} onChange={this.enableGoogleSignIn()} />
                            <p style={{"color":"gray","fontSize":"12pt","display":"inline"}}>I agree to <a href="https://www.adya.io/terms-of-service-agreement/" target="_blank">Terms Of Service </a>and <a href="https://www.adya.io/privacy-policy/" target="_blank">Privacy Policy</a></p>
                            </div>
                            <div className="text-center scan-button p-b-30" style={divStyle}>
                                <a className="btn-wrap btn-wrap-header orange-color font-white" style={anchorStyle} onClick={this.signInGoogle()} target="_blank"><img src="/images/Google.png" /></a>
                                {this.props.inProgress?
                                    <Dimmer active inverted>
                                        <Loader inverted />
                                    </Dimmer>: null
                                }
                            </div>
                            <p><a href="https://www.adya.io/resources/" target="_blank" style={{"color":"#333"}}>Click here for installation instructions</a></p>
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
