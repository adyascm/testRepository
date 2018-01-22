import React, { Component } from 'react';
import { StyleSheet, css } from 'aphrodite/no-important';
import { selectors } from '../PermissionsApp/reducer';
import {connect} from 'react-redux';
import serializeForm from 'form-serialize';
import { SET_FORGOT_PASSWORD_EMAIL as setForgotPasswordEmail } from '../PermissionsApp/actions';
import * as ForgotPasswordAPI from './ForgotPasswordAPI';
import {LOGIN} from '../constants.js';
import {Link} from 'react-router';
import Button from '../Button';

const mapDispatchToProps = {
  setForgotPasswordEmail,
}
const mapStateToProps = state => ({
  getForgotPasswordEmail: ()=>selectors.getForgotPasswordEmail(state),
});

const s = StyleSheet.create({
  container: {
  	width:'70%',
  	margin:'2% auto',
  	textAlign:'center',
  	border: '2px solid #ffffff9c',
  	padding:'4%'
	},
	leftColumn: {
  	display: 'inline-block',
  	paddingRight: '20px',
  	fontSize:'16px',
  	color:'#ffffff9c'
	},
	rightColumn: {
  	/*width: '30%',*/
  	display: 'inline-block',
  	color:'#ffffff9c',
  	width:'40%',
	},
	first_wrapper: {
		margin: '0 auto',
	},
	reset_password_heading: {
		margin: '7% auto 0',
		textAlign:'center',
		color:'#ffffff9c',
		fontSize: '20px'
	},
	password_reset_button: {
		// color:'#ffffff9c',
		// border: '2px solid #ffffff9c',
		color: '#8f6335',
    border: '2px solid #8f6335',
		marginTop:'15px',
		borderRadius: '7px',
		width:'57px',
		padding:'4px',
		':hover': {
    	color: '#d88733',
      border: '2px solid #d88733',
		}
	},
	inputStyle: {
		borderRadius: '7px',
		border:'1.5px solid #ffffff9c',
		height: '32px',
		':focus': {
		outline: 'none',
    borderColor: '#d88733',
    boxShadow: '0 0 10px #d88733',
		}
	},
	// inputStyle:{ 
	// 	':focus': {
	// 	outline: 'none',
 //    borderColor: '#ffffffd9',
 //    boxShadow: '0 0 10px #ffffffd9',
	// 	}
	// },
	password_reset: {
    letterSpacing: '0.5px',
		textAlign: 'center',
		color: '#8f9196',
		padding: '12px',
		fontSize: '20px',
		border: '2px solid #ffffff9c',
		width: '55%',
    margin: '0 auto',
    marginTop: '150px',
	},
	pw_error: {
	marginTop: '15px',
  //marginLeft:'10px',
  textAlign: 'center',
  height: '20px',
  color: 'red',
	}
});

class ResetPassword extends Component {
	constructor(props) {
		super()
		this.state = {
			resetPassword:'',
			email:'',
			status_code_flag: false,
			statusCode:''
		}
		this.submit = this.submit.bind(this);
	}
	
	submit(event) {
		event.preventDefault();
		var reset_pw_url= window.location.href;
		var queryParams = (reset_pw_url.split('?'))[1].split('&')
		var email = (queryParams[0].split('='))[1]
		var authtoken =(queryParams[1].split('='))[1]

		const resetPasswordValue = serializeForm(event.target, {hash: true});
		var new_password = resetPasswordValue.change_password;

		if(resetPasswordValue.change_password === resetPasswordValue.reenter_pw) {
			ForgotPasswordAPI.changePassword(email, new_password, authtoken).then(response => {
				console.log(response)
				let statusCode;
					if(response === true) {
						this.setState({
							resetPassword: new_password,
						})
					}
					else if(response.errorMessage)
					{
						console.log(response.errorMessage)
						let errorJson = JSON.parse(response["errorMessage"])
						statusCode = errorJson.httpStatus
						this.setState({
							statusCode:statusCode,
							status_code_flag:true,
							errorMessage: "Link has already been used. Please consider logging in.",
						})
					}
			});
		}
		// else {
		// 	this.setState({ 
		// 		error:"Password doesn't match."
		// 	 })

		// }
	}
	handleChange = (e) => {
		if(this.refs.input1.value === "" || this.refs.input2.value === "") {
			this.setState({ 
				error:"password is required"
			 })
		}
		else if(this.refs.input1.value !== this.refs.input2.value){
			this.setState({ 
				error:"Password doesn't match."
			 })
		}
		else if(this.refs.input1.value === this.refs.input2.value){
			this.setState({ 
				error:""
			 })
		}
	}
	render() {
		//console.log(email);
		var reset_pw_url= window.location.href;
		var queryParams = (reset_pw_url.split('?'))[1].split('&')
		 var email = (queryParams[0].split('='))[1]
		let message=''
		if(this.state.resetPassword !== '') {
			message = (
				<div className={css(s.password_reset)}>Your password has been reset. Please click here to <Link to="/">Login</Link></div>
			)
		}
		else {
			message= (
				<form onSubmit={this.submit} autoComplete="off">
					<p className={css(s.reset_password_heading)}>Reset password for the email <p style={{color:'#d88733'}}>{email}</p></p>
					<div className={css(s.container)}>
						<div>
								<div className={css(s.leftColumn)}>
									<label style={{marginBottom:'20px'}}>Enter your password</label>
									<label>Re-enter your password</label>
								</div>
								<div className={css(s.rightColumn)}>
									<input className={css(s.inputStyle)} style={{marginBottom:'20px'}} ref="input1" name="change_password" id="cp1" type="password" required />
						  		<input className={css(s.inputStyle)} type="text" name="reenter_pw" ref="input2" id="cp2" type="password" required onChange={this.handleChange}/>
								</div>
						</div>
						<div>
						{ 
	            this.state.errorMessage !== 0 ?
	            <div className={css(s.pw_error)}>{this.state.errorMessage}</div>
	            :<div className={css(s.pw_error)}>{this.state.error}</div>
	           }
	          </div>
						<button className={css(s.password_reset_button)}>OK</button>
					</div>
				</form>
					)
				}
		return(
				<div>{message}</div>
		)
	}
}

export default connect(mapStateToProps, mapDispatchToProps)(ResetPassword);