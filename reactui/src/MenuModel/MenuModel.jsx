import React, { Component } from 'react';
import { StyleSheet, css } from 'aphrodite/no-important';
import { /*colors,*/ spaces } from '../designTokens';


//type THomepageProps = { };
const s = StyleSheet.create({
  model: {
    position:'absolute',
    width:'100%',
    height:'100%',
    top:0,
    left:0,
    right:0,
    zIndex:999,
    backgroundColor:'rgba(12,14,17,0.73)',
  },
  modelDialouge: {
    width:'600px',
    height:'auto',
    backgroundColor:'#1f232c',
    position: 'absolute',
    top:'50%',
    left:'50%',
    transform:'translate(-50%, -50%)',
  },
  modelHeader: {
    display:'flex',
    alignItems: 'center',
    padding:spaces.m
  },
  modelBody: {
  	padding:spaces.m,
  },
  modelFooter: {
  	padding:spaces.m
  },
  heading: {
    flex:1,
  },
  close: {
    padding:'10px 20px',
    color:'#614631',
    cursor:'pointer',
    textDecoration:'none',
  }
});

class MenuModel extends Component {

	render() {

    // console.log(this.props.deleteAccountUser);
		if (!this.props.isVisible) {
	      return null;
	    }
		// else if() {
      return (
      <div className={css(s.model)}>
            <div className={css(s.modelDialouge)}>
              <div className={css(s.modelHeader)}>
                <div className={css(s.heading)}>
                  <h2 style={{color:'#8f9196'}}>{this.props.title}</h2>
                </div>
                <div>
                  <a style={{textDecoration:'none'}} onClick={this.props.handleClose} className={css(s.close)}>
                    <span style={{position:'relative',top:'-4px'}}>Close</span> {this.props.closeTextIcon}
                  </a>
                </div>
              </div>
              <div className={css(s.modelBody)}>
                {this.props.bodyContent}
              </div>
              { this.props.menuModelFooter && <div className={css(s.modelFooter)}> {this.props.menuModelFooter} </div> }

            </div>
      </div>
    );

    // }

  //   }return (
		// 	<div className={css(s.model)}>
	 //          <div className={css(s.modelDialouge)}>
	 //            <div className={css(s.modelHeader)}>
	 //              <div className={css(s.heading)}>
	 //                <h2 style={{color:'#8f9196'}}>{this.props.title}</h2>
	 //              </div>
	 //              <div>
	 //                <a style={{textDecoration:'none'}} onClick={this.props.handleClose} className={css(s.close)}><span style={{position:'relative',top:'-4px'}}>Close</span> {this.props.closeTextIcon}</a>
	 //              </div>
	 //            </div>
	 //            <div className={css(s.modelBody)}>
	 //            	{this.props.bodyContent}
	 //            </div>
	 //            { this.props.menuModelFooter && <div className={css(s.modelFooter)}>
  //               {this.props.menuModelFooter}
	 //            </div>}
	 //          </div>
	 //        </div>
		// );
	}
}

export default MenuModel;
