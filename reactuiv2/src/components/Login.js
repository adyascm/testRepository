import React, { Component } from "react";
import { Redirect } from 'react-router-dom'
import { connect } from 'react-redux';
import authenticate from '../utils/oauth';
import { Segment, Header, Button, Grid, Image, Divider } from 'semantic-ui-react';
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
        this.thumbnails = [{
            image: "/images/Adyadashboard_1.png",
            desc: "See summary of important metrics"
        },
        {
            image: "/images/external_users.gif",
            desc: "See who the external users are"
        },
        {
            image: "/images/working_with_documents.gif",
            desc: "Review all the documents"
        },
        {
            image: "/images/working_with_apps.gif",
            desc: "Review all the installed apps"
        }];
        
    }

    componentWillMount(){
        this.setState({
            currentThumbnail: this.thumbnails[0],
            counter: 0
        });
        this.runner(this);
    }
    componentWillUnmount() {
        this.props.onUnload();
        
    }

    changeThumbnail(that){
        if(that.state){
            var next = that.state.counter + 1;
            that.setState({
                currentThumbnail: this.thumbnails[next%3],
                counter: next
            });
        }
        
    }
    runner(that) {
        this.changeThumbnail(that);
        setTimeout(function() {
            that.runner(that);
        }, 2000);
    }

    render() {
        if (!this.props.currentUser) {
            return (
                <div style={{ height: '100%' }}>
                    <Grid textAlign='center'
                        style={{ height: '100%' }}
                        verticalAlign='middle' >
                        <Grid.Column style={{ maxWidth: 650 }}>
                            <Segment>
                                <Grid>
                                <Grid.Column width={8} verticalAlign='middle' style={{ minHeight:'300px'}} stretched>
                                    <Header as='h3' color='yellow' textAlign='center'>
                                            Manage and secure your SaaS Apps
                                    </Header>
                                        <Image size='large' src={this.state.currentThumbnail.image} />
                                        <Header as='h5' color='green' textAlign='center'>
                                            {this.state.currentThumbnail.desc}    
                                    </Header>
                                    <a target='_blank' href='https://www.adya.io/resources/'>Learn more</a>
                                    </Grid.Column >
                                    <Grid.Column width={8} style={{backgroundColor:'#577484'}}>
                                        <Image size='large' src='/images/AdyaLogo.png' />
                                        
                                        {/*<Segment >
                                 <Button.Group> */}
                                        <Button basic onClick={this.signInGoogle()} loading={this.props.inProgress ? true : false} disabled={this.props.inProgress || this.props.errorMessage ? true : false} >
                                            <Button.Content>
                                                <Image src='/images/btn_google_signin_light_normal_web.png' />
                                            </Button.Content>
                                        </Button>
                                        {/* <Button.Or />
                                    <Button content='SignIn with Microsoft' color='twitter' disabled icon='windows' onClick={this.signInGoogle()} />
                                </Button.Group> 
                            </Segment>*/}
                            <a style={{ color:'white'}} target='_blank' href='https://www.adya.io/privacy-policy/'>Privacy Policy</a>
                                    </Grid.Column >
                                    
                                </Grid>
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
