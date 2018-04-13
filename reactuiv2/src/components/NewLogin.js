import React, { Component } from "react";
import { Redirect } from 'react-router-dom'
import { connect } from 'react-redux';
import authenticate from '../utils/oauth';
import ReactHtmlParser, {convertNodeToElement} from 'react-html-parser'
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

    htmlParserTransform = (node, index) => {
        if (node.type === 'tag' && node.name === 'a' && !node.attribs.href) {
            return (
                <a onClick={this.props.inProgress || this.props.errorMessage ? null : this.signInGoogle()}>
                    <span pointerEvents="none">
                        {convertNodeToElement(node,index,this.htmlParserTransform)}
                    </span>
                </a>
            )
        }
    }

    render() {
        if (!this.props.currentUser) {
            return (
                    ReactHtmlParser(
                        '<div class="app-adya-wrap "> \
                        <div class="clearfix"></div> \
                        <section class="below_header"> \
                        <div class="home_bg"> \
                        <div class="container"> \
                        <div class="padd-top"> \
                            <div class="box-bg text-center bg-grey"> \
                            <img src="/images/logo.png" width="200px" height="100%"/> \
                            <h1 class="orange-color">Manage and secure your SaaS Apps</h1> \
                            <div class="text-center scan-button p-b-30"> \
                                <a class="btn-wrap btn-wrap-header orange-color font-white" target="_blank" style="cursor:pointer"><img src="/images/Google.png"></a> \
                            </div> \
                            <p><a href="https://www.adya.io/resources/" target="_blank" style="color:#333;">Click here for installation instructions</a></p> \
                            <p><a href="https://www.adya.io/privacy-policy/" target="_blank" style="color:gray;font-size:12pt">Privacy Policy</a></p> \
                            </div> \
                            </div> \
                            </div> \
                            </div> \
                        </section> \
                    <div class="clearfix"></div> \
                    </div>',
                    {transform: this.htmlParserTransform}
                    )
            )
        } else {
            return (
                <Redirect to="/" />
            )
        }
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(NewLogin);
